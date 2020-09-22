# fynd-backend

# Movies DB REST API

The following APIs are provided:
- /movies
- /genres
- /search
- /add (requires authentication)
- /delete (requires authentication)
- /update (requires authentication)
- /addgenre (requires authentication)

All the above APIs return the response in JSON format.
The base URL is: https://fynd-app.herokuapp.com/

## Error conditions
1. For the APIs that require authentication, in case of an invalid API key, the API will return 
```
{
	error: 'authentication failed'
}
```
2.  In case of calling an invalid API,
```
{ 
	error: 'invalid API' 
}
```
## Authentication
For the APIs which require authentication, it is necessary to pass an API key in the body of the POST request under the key `apiKey` (See curl examples).

The following 3 API keys are valid:
```
aba102da-f581-4ff7-a350-b7b671f70e68
68888a10-6c29-4313-8401-e05948a7af18
91f670f4-26c3-4e08-9fee-f44ee1e61484
```
## /movies

Returns an array of all the movies in the database.
Fields returned:
- id
- name
- popularity
- genre (Array of genres)
- imdb_score
- director
```
curl https://fynd-app.herokuapp.com/movies
```
Response:
```
[
    {
        "imdb_score": 8.8,
        "director": "George Lucas",
        "popularity": 88,
        "id": 2,
        "genre": [
            "Action",
            "Adventure",
            "Fantasy",
            "Sci-Fi"
        ],
        "name": "Star Wars",
        "99popularity": 88,
        "genres": "Action, Adventure, Fantasy, Sci-Fi"
    },
    {
        "imdb_score": 6.6,
        "director": "Giovanni Pastrone",
        "popularity": 66,
        "id": 3,
        "genre": [
            "Adventure",
            "Drama",
            "War"
        ],
        "name": "Cabiria",
        "99popularity": 66,
        "genres": "Adventure, Drama, War"
    },
    {
        "imdb_score": 8.7,
        "director": "Alfred Hitchcock",
        "popularity": 87,
        "id": 4,
        "genre": [
            "Horror",
            "Mystery",
            "Thriller"
        ],
        "name": "Psycho",
        "99popularity": 87,
        "genres": "Horror, Mystery, Thriller"
    },
    {
        "imdb_score": 8,
        "director": "Merian C. Cooper",
        "popularity": 80,
        "id": 5,
        "genre": [
            "Adventure",
            "Fantasy",
            "Horror"
        ],
        "name": "King Kong",
        "99popularity": 80,
        "genres": "Adventure, Fantasy, Horror"
    },
    {
        "imdb_score": 8.4,
        "director": "Fritz Lang",
        "popularity": 84,
        "id": 6,
        "genre": [
            "Adventure",
            "Drama",
            "Sci-Fi"
        ],
        "name": "Metropolis",
        "99popularity": 84,
        "genres": "Adventure, Drama, Sci-Fi"
    },
    {
        "imdb_score": 8.6,
        "director": "Marc Daniels",
        "popularity": 86,
        "id": 7,
        "genre": [
            "Adventure",
            "Sci-Fi"
        ],
        "name": "Star Trek",
        "99popularity": 86,
        "genres": "Adventure, Sci-Fi"
    }
]
```

## /genres
Returns an array of movie genres currently in the DB.

```
curl https://fynd-app.herokuapp.com/genres
```
Response:
```
[
    {
        "name": "Adventure",
        "id": 2
    },
    {
        "name": "Family",
        "id": 3
    },
    {
        "name": "Fantasy",
        "id": 4
    },
    {
        "name": "Musical",
        "id": 5
    },
    {
        "name": "Action",
        "id": 6
    },
    {
        "name": "Sci-Fi",
        "id": 7
    }
]
```

## /search
Used to search for movies by name and/or director.
Returns an array of all the movies in the database which meet the search criteiria.
Search is case-sensitive.

### Parameters:
- name (optional)
- director (optional)

**NOTE: either name or director is required. Both can be supplied.**

```
curl --location --request GET 'https://fynd-app.herokuapp.com/search?director=Sp'
```
Response:
```
[
    {
        "imdb_score": 8.3,
        "director": "Steven Spielberg",
        "popularity": 83,
        "id": 14,
        "name": "Jaws"
    },
    {
        "imdb_score": 8.7,
        "director": "Steven Spielberg",
        "popularity": 87,
        "id": 35,
        "name": "Raiders of the Lost Ark"
    },
    {
        "imdb_score": 7.9,
        "director": "Steven Spielberg",
        "popularity": 79,
        "id": 39,
        "name": "E.T. : The Extra-Terrestrial"
    },
    {
        "imdb_score": 7.8,
        "director": "Steven Spielberg",
        "popularity": 78,
        "id": 113,
        "name": "Close Encounters of the Third Kind"
    },
    {
        "imdb_score": 7.7,
        "director": "Steven Spielberg",
        "popularity": 77,
        "id": 131,
        "name": "Duel"
    },
    {
        "imdb_score": 7.9,
        "director": "Steven Spielberg",
        "popularity": 79,
        "id": 135,
        "name": "Jurassic Park"
    }
]
```

```
curl --location --request GET 'https://fynd-app.herokuapp.com/search?name=Ja' 
```
Response: 
```
[
    {
        "imdb_score": 8.3,
        "director": "Steven Spielberg",
        "popularity": 83,
        "id": 14,
        "name": "Jaws"
    },
    {
        "imdb_score": 8.4,
        "director": "Stanley Kubrick",
        "popularity": 84,
        "id": 220,
        "name": "Full Metal Jacket"
    }
]
```

```
curl --location --request GET 'https://fynd-app.herokuapp.com/search?director=Sp&name=Ja'
```
Response:
```
[
    {
        "imdb_score": 8.3,
        "director": "Steven Spielberg",
        "popularity": 83,
        "id": 14,
        "name": "Jaws"
    },
    {
        "imdb_score": 8.4,
        "director": "Stanley Kubrick",
        "popularity": 84,
        "id": 220,
        "name": "Full Metal Jacket"
    }
]
``` 
## /add

Adds a movie to the database.

Parameters:
- name (required)
- director (required)
- genreIds (required)
- imdb_score (required)
- popularity (required)
- apiKey (required)
```
curl --location --request POST 'https://fynd-app.herokuapp.com/add' \
--data-urlencode 'name=The Last Dance' \
--data-urlencode 'director=Sylvester Stallone' \
--data-urlencode 'popularity=55' \
--data-urlencode 'genreIds=[3,4,5]' \
--data-urlencode 'imdb_score=3.5' \
--data-urlencode 'apiKey=aba102da-f581-4ff7-a350-b7b671f70e68'
```
Response:
```
{
    "movieId": 272,
    "added": true
}
```
## /delete
Deletes a movie from the database.

Parameters:
- id (required)

```
curl --location --request POST 'https://fynd-app.herokuapp.com/delete' \
--data-urlencode 'apiKey=aba102da-f581-4ff7-a350-b7b671f70e68' \
--data-urlencode 'id=200'
```
Response:
```
{
    "id": 275,
    "deleted": true
}
```

## /update

Updates a movie from the database.

Parameters:
- id (required)
- director (optional)
- genreIds (optional)
- imdb_score (optional)
- popularity (optional)
- apiKey (required)

**Note: Atleast one of the optional parameters is mandatory**

```
curl --location --request POST 'https://fynd-app.herokuapp.com/update' \
--data-urlencode 'director=Sylvester Stallone Statham' \
--data-urlencode 'popularity=55' \
--data-urlencode 'imdb_score=3.5' \
--data-urlencode 'apiKey=aba102da-f581-4ff7-a350-b7b671f70e68'
```
Response:
```
{
    "movieId": 272,
    "updated": true
}
```

## /addgenre

Add a genre to the database.

Parameters:
- genre (required) (Name of the genre to add)
- apiKey (required)


```
curl --location --request POST 'https://fynd-app.herokuapp.com/addgenre' \
--data-urlencode 'genre=Fantasy-Musical' \
--data-urlencode 'apiKey=aba102da-f581-4ff7-a350-b7b671f70e68'
```
Response:
```
{
    "genreId": 98,
    "added": true
}
```