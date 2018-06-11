const router = require('express').Router();
const bcrypt = require('bcryptjs');
const ObjectId = require('mongodb').ObjectId;

const { generateAuthToken, requireAuthentication } = require('../lib/auth');


const { getReviewsByUserID } = require('./reviews');


function validateUserObject(user) {
  return user && user.userID && user.name && user.email;
}

function insertNewUser(user, mongoDB) {
  return bcrypt.hash(user.password, 8)
    .then((passwordHash) => {
      const userDocument = {
        userID: user.userID,
        name: user.name,
        email: user.email,
        password: passwordHash
      };
      const usersCollection = mongoDB.collection('users');
      return usersCollection.insertOne(userDocument);
    })
    .then((result) => {
      return Promise.resolve(result.insertedId);
    });
}

function getUserByID(userID, mongoDB, includePassword) {
  const usersCollection = mongoDB.collection('users');
  const projection = includePassword ? {} : { password: 0 };
  //console.log(userID);
  return usersCollection
    .find({ userID: userID })
    .project(projection)
    .toArray()
    .then((results) => {
      //console.log(results);
      return Promise.resolve(results[0]);
    });
}

/*
 * Route to create a new user.
 */
router.post('/', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  if (validateUserObject(req.body)) {
    insertNewUser(req.body, mongoDB)
      .then((id) => {
        res.status(201).json({
          _id: id,
          links: {
            user: `/users/${id}`
          }
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: "Failed to insert new user, maybe this user already exists?"
        });
      });
  } else {
    res.status(400).json({
      error: "Request doesn't contain a valid user."
    })
  }
});

/* Route to Login */
router.post('/login', function (req, res) {
  const mongoDB = req.app.locals.mongoDB;
  if (req.body && req.body.userID && req.body.password) {
    getUserByID(req.body.userID, mongoDB, true)
      .then((user) => {
        if (user) {
          return bcrypt.compare(req.body.password, user.password);
        } else {
          return Promise.reject(401);
        }
      })
      .then((loginSuccessful) => {
        if (loginSuccessful) {
          return generateAuthToken(req.body.userID);
        } else {
          return Promise.reject(401);
        }
      })
      .then((token) => {
        res.status(200).json({
          token: token
        });
      })
      .catch((err) => {
        console.log(err);
        if (err === 401) {
          res.status(401).json({
            error: "Invalid credentials."
          });
        } else {
          res.status(500).json({
            error: "Failed to fetch user."
          });
        }
      });
  } else {
    res.status(400).json({
      error: "Request needs a user ID and password."
    })
  }
});



/*
 * Route to list all of a user's reviews.
 */
router.get('/:userID/reviews', requireAuthentication, function (req, res) {
  const mysqlPool = req.app.locals.mysqlPool;
  const userID = parseInt(req.params.userID);

  if (req.user !== req.params.userID) {
    res.status(403).json({
      error: "Unauthorized to access the specified resource"
    });
  } else {
      getReviewsByUserID(userID, mysqlPool)
    .then((reviews) => {
      if (reviews) {
        res.status(200).json({ reviews: reviews });
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch reviews.  Please try again later."
      });
    });
  }

});



/*
Route to get info about specific user
*/
router.get('/:userID', requireAuthentication, function (req, res, next) {
    const mongoDB = req.app.locals.mongoDB;

    if (req.user !== req.params.userID) {
      res.status(403).json({
      error: "Unauthorized to access the specified resource"
    });
    } else {
      getUserByID(req.params.userID, mongoDB, true)
      .then((user) => {
        if (user) {
          res.status(200).json({
            userID: user.userID,
            name: user.name,
            email: user.email
          })
        } else {
            return Promise.reject(401);
          }
        })
      .catch((err) => {
        console.log(err);
        if (err === 401) {
          res.status(401).json({
            error: "Invalid credentials."
          });
        } else {
          res.status(500).json({
            error: "Failed to fetch user."
          });
        }
      });
    }
});



exports.router = router;
