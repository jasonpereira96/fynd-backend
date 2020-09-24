# Scalability Document

Feature expectations: 

1. Users can view or search for movies.
2. Previledged users can add, delete and update movie data.
3. Previledged users can add a genre.

## Estimations

### Storage capacity estimation

We want to scale up the system to store 5 * 5 million = 25M movies. If we assume that 1 movie record takes up 1 KB of data, then we require 25 GB of storage space. 

However, if we add more information about movies, like a long description or thumbnail images, then this number could go up very quickly.

Also, for serving static images we will need a distributed storage service like Amazon’s S3.

### Computing power

Our server should be able to handle 5 * 15M = 75M requests a day. That amounts to two billion two hundred fifty million requests a month. AWS can easily handle this kind of load  at approximately $2.38 per million requests. (https://aws.amazon.com/api-gateway/pricing/)

### RAM
If we want to cache 20% of these requests, we need memory of 0.2 * 75M * 1Mb = 15 GB of RAM a day.

## Load balancing

To service these many requests, multiple servers many be required. To ensure that the requests are distributed fairly eqully, a load balancer is required. Ngnix is a popular out of the box open-source option.

## Read-Write ratio
An important factor to consider while designing any scalable system is its read-write ratio. We can assume that in our system, reads are going to be far more frequent than writes, since then number of movies produced every year and the number of times re-ranking of their popularity ratings is far less than the number of search or read requests we will get for our API.


## Choice of Database
I have used Postgres, a popular SQL database for storing the data.

## Consistency vs. Availability

For this application, we shall prefer to prioritze availablity over consistency, since movie ratings are not time-critical data and even if a client gets an incorrect value of popularity/score occasionally, it doesnt cause too much damage. 


## Replication of Data

Since data is valuable and cannot be lost, we should keep a couple of replicas so that we in case one of the DB servers goes down, we can fetch the data from another. Of course there will be an overhead since for every update to the system, we will have to update the corresponding replica as well. Since writes will be infrequent as compared to reads and consistency is not a huge priority, replica updates can happen asynchronously. This can lead to a noticiable performance improvment.


## Caching
Caching is an essential operation to speed up reads. Since we can assume that the number of reads will far exceed the number of writes, because movie data doesnt get updated very frequently compared to the number of requests for it, cache misses will be relatively infrequent. 
Least Recently Used (LRU) can be a reasonable policy for our system. Under this policy, we discard the least recently used record first. We can use a Linked Hash Map or a similar data structure to store our records, which will also keep track of the results that have been accessed recently.

## Speeding up /search

The /search API will be one of the most frequently used APIs in our application. An in-memroy cache like memcached would be greatly useful here. AWS also provides a self-managed memcached service. Care should be taken that the size of the cache shouldnt grow too much.

Like any other search API, we can assume that there will be some extremely popular searches that a lot of users may search for. We can maintain a list of very popular searches and cache them for reads. Netflix’s Open Connect (link) works on a similar principle by caching the most watched shows on local servers themselves. This way, requests  have to hit the main datacenters in the US only occasionally. This is done geographically since every region/country has its own set of most popular shows. We could apply the same idea to searches.

## Searching the database

Currently the search API only supports searching by name and director. However users may come to expect more features from search. We could then support search criteria like top 10, bottom 10, filter by score greater than, etc. The application server’s codebase would have to be extended to support such search queries.
If search becomes a big priority, then Elasticsearch (link) provides an excellent out of the box solution for searching. It provides queries with ranking as well as full-text search.


## Authentication

Currently, previdelged users are being authenticated via an API key. Therefore, a reilable method of generating an API key is required. One possible option is to use UUIDs



## Rate limiting

To control the number of requests to our service, we can employ some simple rate limiting policies.

For authenticated requests, we could cap the number of requests per day to certain figure (maybe 1000 requests per day). This will keep the API service heathly. If a user requires more requests, they would need to pay a subscription fee. There could be different tiers of subscription fees, depending on how many requests the user requires.


