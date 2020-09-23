var express = require('express')
const { Client } = require('pg');
const cors = require('cors');
const path = require('path');
const PORT = process.env.PORT || 5000;

// const PORT = 3001; //application server port
const DB_PORT = 5432;

// const USERNAME = 'postgres';
// const PASSWORD = 'postgres';
// const HOST = 'localhost';
// const DATABASE = 'Movies'

const USERNAME = 'cxqyzdmbsgnzxx';
const HOST = 'ec2-18-203-7-163.eu-west-1.compute.amazonaws.com';
const DATABASE = 'd92ch17m0ic12f';
const PASSWORD = 'd960a0ea5e09081b4d642bfb3164c685cfe10f7516086399f7f61271c280e85e';


const API_KEYS = [
    'aba102da-f581-4ff7-a350-b7b671f70e68',
    '68888a10-6c29-4313-8401-e05948a7af18',
    '91f670f4-26c3-4e08-9fee-f44ee1e61484'
];

const app = express();
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());
app.use(authenticate);

const SCHEMA = 'public';

app.get('/', function (request, response) {
    response.send('Welcome to the Movies DB REST API. See https://github.com/jasonpereira96/fynd-backend#movies-db-rest-api for documentation');
});

app.post('/credentials', function (request, response) {
    console.log(request.body);
    // console.log(typeof request.body); //object
    if (request.body.username === 'admin' && request.body.password === 'admin') {
        response.json({
            valid: true
        });
    } else {
        response.json({
            valid: false
        });
    }
});
app.get('/movies', function (request, response) {
    var promise1 = query({
        queryString: `select * from ${SCHEMA}.movies;`,
    });
    var promise2 = query({
        queryString: `select * from ${SCHEMA}.genres;`,
    });
    Promise.all([promise1, promise2]).then(function ([movies, genres]) {
        movies = movies.rows;
        genres = genres.rows;

        var idToGenre = genres.reduce((acc, item) => {
            acc[item.id] = item.name;
            return acc;
        }, {});

        movies.forEach(movie => {
            var genreIds = JSON.parse(movie.genre_ids);
            var genres = genreIds.map(genreId => idToGenre[genreId]);
            movie.genre = genres;
            delete movie.genre_ids;
            movie.name = movie.movie_name;
            delete movie.movie_name;
            movie['99popularity'] = movie.popularity;
            movie.genres = movie.genre.join(', ');
        });

        response.json(movies);
    });
});

app.post('/add', function (request, response) {
    var { name, director, popularity, genreIds, imdb_score } = request.body;
    var queryString = `insert into ${SCHEMA}.movies (movie_name, director, popularity, imdb_score, genre_ids) 
        values($1, $2, $3, $4, $5) returning id;`;
    console.log(queryString);
    console.log(request.body);
    query({
        queryString,
        params: [name, director, popularity, imdb_score, genreIds]
    }).then(result => {
        response.json({
            movieId: result.rows[0].id,
            added: true
        });
    });
});
app.post('/delete', function (request, response) {
    var { id } = request.body;
    query({
        queryString: `delete from ${SCHEMA}.movies where id = $1 returning id;`,
        params: [id]
    }).then(result => {
        if (result.rowCount === 0) {
            response.json({
                error: 'invalid movie id'
            });
        } else {
            response.json({
                id: result.rows[0].id,
                deleted: true
            });
        }
    });
});
app.post('/update', function (request, response) {
    var { id, director, popularity, imdb_score, genreIds } = request.body;
    console.log(request.body);
    const NULL = 'NULL';
    var position = 1;
    var params = [];
    var predicates = [];
    if (director !== NULL) {
        predicates.push(`director = $${position++}`);
        params.push(director);
    }
    if (popularity !== NULL) {
        predicates.push(`popularity = $${position++}`);
        params.push(popularity);
    }
    if (imdb_score !== NULL) {
        predicates.push(`imdb_score = $${position++}`);
        params.push(imdb_score);
    }
    if (genreIds !== NULL) {
        predicates.push(`genre_ids = $${position++}`);
        params.push(genreIds);
    }
    if (predicates.length === 0) {
        response.json({
            error: 'one field to update is mandatory'
        });
        return;
    }
    var predicate = predicates.join(',');
    params.push(id);

    var queryString = `update ${SCHEMA}.movies set ${predicate} where id = $${position++}  returning id;`;
    console.log(queryString);
    console.log(params);

    query({
        queryString: queryString,
        params: params
    }).then(function (result) {
        if (result.rowCount > 0) {
            var id = result.rows[0].id;
            return query({
                queryString: `select * from ${SCHEMA}.movies where id = $1;`,
                params: [id]
            });
        } else {
            response.json({
                error: 'invalid movie id'
            });
        }
    }).then(result => {
        let ret = {
            ...result.rows[0],
            id: result.rows[0].id,
            updated: true
        };
        ret.name = ret.movie_name;
        delete ret.movie_name;
        return ret;
    }).then(result => {
        console.log('AAA');
        console.log(result);
        let genreIds = JSON.parse(result.genre_ids);
        let ids = genreIds.join(' , ');
        query({
            queryString: `select * from ${SCHEMA}.genres where id in ( ${ids} )`
        }).then(genresResult => {
            let genres = genresResult.rows.map(row => row.name);
            result.genre = genres;
            response.json(result);
        });
    });
});

app.get('/genres', function (request, response) {
    query({
        queryString: `select * from ${SCHEMA}.genres;`,
        params: [],
    }).then(result => {
        response.json(result.rows);
    })
});
app.post('/addgenre', function (request, response) {
    // insert  into "Movies".public.genres (name) values('AAA');
    var { genre } = request.body;
    if (!genre) {
        response.json({
            error: 'genre is mandatory'
        });
    } else {
        query({
            queryString: `insert into ${SCHEMA}.genres (name) values('${genre}') returning id;`,
            params: []
        }).then(result => {
            response.json({
                genreId: result.rows[0].id,
                added: true
            });
        });
    }
});

app.get('/search', function (request, response) {
    var { name, director } = request.query;
    if (!name && !director) {
        response.json({
            error: 'either name or director (or both) required'
        });
    } else {
        if (name && !director) {
            query({
                queryString: `select  movie_name, imdb_score , director, popularity, id
                  from ${SCHEMA}.movies where movie_name like $1;`,
                params: [`%${name}%`]
            }).then(movies => handleResult(movies, response));
        } else if (!name && director) {
            query({
                queryString: `select  movie_name, imdb_score , director, popularity, id
                  from ${SCHEMA}.movies where director like $1;`,
                params: [`%${director}%`]
            }).then(movies => handleResult(movies, response));
        } else {
            query({
                queryString: `select  movie_name, imdb_score , director, popularity, id
                  from ${SCHEMA}.movies where movie_name like $1 and director like $2;`,
                params: [`%${name}%`, `%${director}%`]
            }).then(movies => handleResult(movies, response));
        }
    }
});



// app.use(express.static(path.join(__dirname, 'public')));
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
// app.get('/', (req, res) => res.render('pages/index'));
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
/*
app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});*/

function getClient() {
    return new Client({
        user: USERNAME,
        host: HOST,
        database: DATABASE,
        password: PASSWORD,
        port: DB_PORT
    });
}

function query(options) {
    var { queryString, params } = options;
    if (!params) {
        params = [];
    }
    return new Promise(function (resolve, reject) {
        const client = getClient();
        client.connect().then(function () {
            console.log('Connection successful!');
            client.query(queryString, params).then(result => {
                resolve(result);
            }).catch(e => {
                console.log(e);
                reject(e);
            }).finally(() => {
                client.end();
                console.log('Connection ended!');
            })
        }).catch(function (e) {
            console.log(e);
        });
    });
}


function authenticate(request, response, next) {
    console.log(request.path);
    switch (request.path) {
        case '/credentials':
        case '/movies':
        case '/genres':
        case '/search':
        case '/':
            next();
            break;
        case '/add':
        case '/delete':
        case '/update':
        case '/addgenre':
            var { apiKey } = request.body;
            if (apiKey && API_KEYS.includes(apiKey)) {
                next();
            } else {
                response.json({
                    error: 'authentication failed'
                });
            }
            break;
        default:
            response.json({
                error: 'invalid API'
            });
    }
}


function handleResult(movies, response) {
    movies = movies.rows;
    movies.forEach(movie => {
        movie.name = movie.movie_name;
        delete movie.movie_name;
    });
    response.json(movies);
}