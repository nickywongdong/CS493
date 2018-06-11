# Final Project Proposal
		
CS 493 - Spring 2018

Members:

* Bradley Imai
* Michael Rodriguez
* Nicholas Wong
* Shane Barrantes 

[Link to Postman API endpoints](https://documenter.getpostman.com/view/4256353/RWEZTicJ)

					
## High-level description of the purpose of the API
We will be creating a RESTful API that will allow a user to interact with resources consisting of beers, manufactures and
reviews. Under the REST paradigm, clients use predefined operations to request specific resources (such as types of
beers) from a server using actions, and the server will transfer some kind of representation of those resources back to 
the client. So applying this to our beer API, users will be able to post and get different information about beers, 
manufactures, and reviews. Users will be limited to 1 review per beer as they can either modify or delete it if they wish 
to change it. All in all, users of the API will have the power to get information about specific beers such as alcohol 
percentage, calories, type, manufacturer information and reviews. 




* Beer 
  * id
  * manufacturerid
  * Name 
  * abv
  * ibu
  * Calories 
  * Type
* Manufacturer
  * id
  * beerid
  * City
  * State
  * Zip
  * Phone number
* Reviews 
  * id
  * userid
  * beerid
  * dollars
  * stars 
  * review

## High-level description of the specific endpoints our API 
This API will allow users to interact with the beer, manufacturer and review resources using actions such as GET, POST, PUT, and DELETE. The users will be able to get, add, modify and delete from the reviews resource and will be able to get and add from the beers and manufacturer resources. 

* Beer
  * GET localhost:8000/beer/     # Get all Beers
  * GET localhost:8000/beer/4   # Get information about specific beer with ID 4.
  * POST localhost:8000/beer/   # Post a beer

 Example JSON:
```JSON
{
"beerID": "10",
"name": "Pacifico",
"abv": "5.4",
"ibu": "6",
"calories": "146", 
"type": "pilsner"
}
```

* Manufacturer 
  * GET  localhost:8000/manufacturer/		# Get info for all reviews
  * POST localhost:8000/manufacturer/		# Add a manufacturer to the list
* Reviews
  * GET localhost:8000/reviews/		# Get info for all reviews
  * POST localhost:8000/reviews/	# Add a review to the reivews list
  * PUT localhost:8000/reviews/3	# Modify a specific review with ID 3
  * DELETE localhost:8000/reviews/3	# Delete a specific review with ID 3


## Description of how data will be stored by API
The Beer, Manufacturer, and Reviews resources will be stores in a MySQL relational database. The SQL database will
consist of three tables for each resource. Tables will be populated with the attributes that we outlined for each
resource in the first part of the proposal. MySQL will be used because while these are separate resources, they have
direct relationships between entities. We will use MongoDB as a source of keeping track of security measures. In
order to interact with any of the above resources users will need to be supplied with an API key beforehand.

## Description of security mechanisms our API will implement
The security mechanism that we will implement for our API will consist of a JWT based authorization system that will 
be stored in a simple Mongo database. This will ensure that are system is fully secure by combining a hashed password
with salt to create a unique key. 

