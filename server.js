var express = require('express')
const { Client } = require('pg');
const cors = require('cors');

const PORT = 3001; //application server port
const DB_PORT = 5432;
const USERNAME = 'postgres';
const PASSWORD = 'postgres';
const HOST = 'localhost';

const app = express();
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());

const SCHEMA = 'public';

/*
client.query('SELECT $1::text as message', ['Hello world!'], (err, res) => {
    console.log(err ? err.stack : res.rows[0].message) // Hello World!
    client.end();
});*/
// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
    res.send('hello world');
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
app.get('/data', function (request, response) {
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

app.get('/data1', function (request, response) {
    query({
        queryString: `select * from ${SCHEMA}.movies;`,
    }).then(result => {
        response.json(result.rows);
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
        queryString: `delete from ${SCHEMA}.movies where id = $1;`,
        params: [id]
    }).then(result => {
        response.json({
            deleted: true
        });
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
    var predicate = predicates.join(',');
    params.push(id);

    var queryString = `update ${SCHEMA}.movies set ${predicate} where id = $${position++}  returning id;`;
    console.log(queryString);
    console.log(params);

    query({
        queryString: queryString,
        params: params
    }).then(function (result) {
        var id = result.rows[0].id;
        return query({
            queryString: `select * from ${SCHEMA}.movies where id = $1;`,
            params: [id]
        });
    }).then(result => {
        response.json(result.rows[0]);
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
    query({
        queryString: `insert into ${SCHEMA}.genres (name) values('${genre}') returning id;`,
        params: []
    }).then(result => {
        response.json({
            genreId: result.rows[0].id,
            added: true
        });
    })
});

app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});

function getClient() {
    return new Client({
        user: USERNAME,
        host: HOST,
        database: 'Movies',
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