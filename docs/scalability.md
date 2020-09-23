# Scalability Document

Feature expectations ( First 2 mins ) : 
As said earlier, there is no wrong design. There are just good and bad designs and the same solution can be a good design for one use case and a bad design for the other. It is extremely important hence to get a very clear understanding of whats the requirement for the question.

Users can view or search for movies.

Previledged users can add, delete and update movie data.

## Estimations ( 2-5 mins ) 
Next step is usually to estimate the scale required for the system. The goal of this step is to understand the level of sharding required ( if any ) and to zero down on the design goals for the system. 
For example, if the total data required for the system fits on a single machine, we might not need to go into sharding and the complications that go with a distributed system design. 
OR if the most frequently used data fits on a single machine, in which case caching could be done on a single machine.

### Storage capacity estimation

We want to scale up the system to store 5 * 5 million = 25M movies. If we assume that 1 movie record takes up 1 MB of data (a gross overestimation), then we require 25 TB of storage space. 

However, if we add more information about movies, like a long description or thumbnail images, then this number could go up very quickly.

Also, for serving static images we will need a distributed storage service like Amazon’s S3.

### Computing power### Storage capacity estimation

Our server should be able to handle 5 * 15M = 75M requests a day. That amounts to two billion two hundred fifty million requests a month. AWS can easily handle this kind of load  at approximately $2.38 per million requests. (https://aws.amazon.com/api-gateway/pricing/)

### RAM
If we want to cache 20% of these requests, we need memory of 0.2 * 75M * 1Mb a day.

Change these numbers! RAM is too much

## Database schema daigram

## load balancing

To service these many requests, multiple machines many be required. To ensure that the requests are distributed fairly eqully, a load balancer is required. Ngnix is a popular out of the box open-source option.



## RDMBS vs NoSQL
Since we have a simple scehma that shouldn’t require any changes, there should be no need for changing the scemha

## Reliabitiy and redundancy

Since data is valuable and cannot be lost, we should keep a couple of replicas so that we in case one of the DB servers goes down, we can fetch the data. Of course there will be an overhead since for every update to the system, we will have to update the corresponding replica as well.

## Consistency vs. Availability

For this application, we shall prefer to prioritze availablity over consistency, since movie ratings are not time-critical data and even if a client gets an incorrect value of popularity/score it doesnt cause too much damage. 
This is important when deciding the caching algorithm.

## Caching
Caching is an essential operation to speed up reads. Since we can assume that the number of reads will far exceed the number of writes, because movie data doesnt get updated very frequently compared to the number of requests for it, cache misses will be relatively infrequent. 

## Speeding up /search

The /search API will be one of the most frequently used APIs in our application. An in-memroy cache like memcached would be greatly useful here. AWS also provides a self-managed memcached service. Care should be taken that the size of the cache shouldnt grow too much.

Like any other search API, we can assume that there will be some extremely popular searches that a lot of users may search for. We can maintain a list of very popular searches and cache them for reads. Netflix’s Open Connect (link) works on a similar principle by caching the most watched shows on local servers themselves. This way, requests  have to hit the main datacenters in the US only occasionally. This is done geographically since every region/country has its own set of most popular shows. We could apply the same idea to searches.

## Searching the database

Currently the search API only supports searching by name and director. However users may come to expect more features from search. We could then support search criteria like top 10, bottom 10, filter by score greater than, etc. 
If search becomes a big priority, then Elasticsearch (link) provides an excellent out of the box solution for searching. It provides queries with ranking as well as full-text search.


## Authentication

Currently, previdelged users are being authenticated via an API key. Therefore, a reilable method of generating an API key is required. One possible option is to use UUIDs



## Rate limiting

To control the number of requests to our service, we can employ some simple rate limiting policies.

For authenticated requests, we could cap the number of requests per day to certain figure (maybe 10K requests per day). This will keep the API service heathly. If a user requires more requests, they would need to pay a subscription fee. There could be different tiers of subscription fees, depending on how many requests the user requires.


