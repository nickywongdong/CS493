const router = require('express').Router();
const validation = require('../lib/validation');

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  dollars: { required: true },
  stars: { required: true },
  review: { required: false },
  userid: { required: true },
  beerid: { required: true }
};


/*
 * Executes a MySQL query to verfy whether a given user has already reviewed
 * a specified beer.  Returns a Promise that resolves to true if the
 * specified user has already reviewed the specified business or false
 * otherwise.
 */
function hasUserReviewedBeer(userID, beerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT COUNT(*) AS count FROM reviews WHERE userid = ? AND beerid = ?',
      [ userID, beerID ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count > 0);
        }
      }
    );
  });
}

/*
 * Executes a MySQL query to insert a new review into the database.  Returns
 * a Promise that resolves to the ID of the newly-created review entry.
 */
function insertNewReview(review, mysqlPool) {
  return new Promise((resolve, reject) => {
    review = validation.extractValidFields(review, reviewSchema);
    review.id = null;
    console.log(review);
    mysqlPool.query(
      'INSERT INTO reviews SET ?',
      review,
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
        }
      }
    );
  });
}

/*
 * Route to create a new review.
 */
router.post('/', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  if (validation.validateAgainstSchema(req.body, reviewSchema)) {
    /*
     * Make sure the user is not trying to review the same business twice.
     * If they're not, then insert their review into the DB.
     */
    hasUserReviewedBeer(req.body.userid, req.body.beerid, mysqlPool)
      .then((hasUserReviewedBeer) => {
        if (!hasUserReviewedBeer) {
          return Promise.reject(403);
        } else {
          return insertNewReview(req.body, mysqlPool);
        }
      })
      .then((id) => {
        res.status(201).json({
          id: id,
          links: {
            review: `/reviews/${id}`,
            beer: `/beer/${req.body.beerid}`
          }
        });
      })
      .catch((err) => {
        console.log(err);
        if (err === 403) {
          res.status(403).json({
            error: "User has already posted a review of this beer"
          });
        } else {
          res.status(500).json({
            error: "Error inserting review into DB.  Please try again later."
          });
        }
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid review object."
    });
  }
});

/*
 * Executes a MySQL query to fetch a single specified review based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * review.  If no review with the specified ID exists, the returned Promise
 * will resolve to null.
 */
function getReviewByID(reviewID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM reviews WHERE id = ?', [ reviewID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const reviewID = parseInt(req.params.reviewID);
  getReviewByID(reviewID, mysqlPool)
    .then((review) => {
      if (review) {
        res.status(200).json(review);
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch review.  Please try again later."
      });
    });
});

/*
 * Executes a MySQL query to replace a specified review with new data.
 * Returns a Promise that resolves to true if the review specified by
 * `reviewID` existed and was successfully updated or to false otherwise.
 */
function replaceReviewByID(reviewID, review, mysqlPool) {
  return new Promise((resolve, reject) => {
    review = validation.extractValidFields(review, reviewSchema);
    mysqlPool.query('UPDATE reviews SET ? WHERE id = ?', [ review, reviewID ], function (err, result) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log("no error");
        resolve(result.affectedRows > 0);
      }
    });
  });
}

/*
 * Route to update a review.
 */
router.put('/:reviewID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const reviewID = parseInt(req.params.reviewID);
  if (validation.validateAgainstSchema(req.body, reviewSchema)) {
    let updatedReview = validation.extractValidFields(req.body, reviewSchema);
    /*
     * Make sure the updated review has the same businessID and userID as
     * the existing review.  If it doesn't, respond with a 403 error.  If the
     * review doesn't already exist, respond with a 404 error.
     */
    getReviewByID(reviewID, mysqlPool)
      .then((existingReview) => {
        console.log(existingReview);
        console.log(updatedReview);
        if (existingReview) {
          if (updatedReview.beerid === existingReview.beerid && updatedReview.userid === existingReview.userid) {
            return replaceReviewByID(reviewID, updatedReview, mysqlPool);
          } else {
            return Promise.reject(403);
          }
        } else {
          next();
        }
      })
      .then((updateSuccessful) => {
        if (updateSuccessful) {
          res.status(200).json({
            links: {
              beer: `/beer/${updatedReview.beerid}`,
              review: `/reviews/${reviewID}`
            }
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        if (err === 403) {
          res.status(403).json({
            error: "Updated review must have the same beerID and userID"
          });
        } else {
          res.status(500).json({
            error: "Unable to update review.  Please try again later."
          });
        }
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid review object."
    });
  }
});

/*
 * Executes a MySQL query to delete a review specified by its ID.  Returns
 * a Promise that resolves to true if the review specified by `reviewID`
 * existed and was successfully deleted or to false otherwise.
 */
function deleteReviewByID(reviewID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('DELETE FROM reviews WHERE id = ?', [ reviewID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });

}

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const reviewID = parseInt(req.params.reviewID);
  deleteReviewByID(reviewID, mysqlPool)
    .then((deleteSuccessful) => {
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to delete review.  Please try again later."
      });
    });
});


/*
* Route to list reviews:
*/

 router.get('/', function (req, res) {
  const mysqlPool = req.app.locals.mysqlPool;

  getReviewsCount(mysqlPool)
    .then((count) => {
      return getReviewsPage(parseInt(req.query.page) || 1, count, mysqlPool);
    })
    .then((reviewsInfo) => {
      reviewsInfo.links = {};
      let { links, lastPage, pageNumber } = reviewsInfo;
      if (pageNumber < lastPage) {
        links.nextPage = '/reviews?page=' + (pageNumber + 1);
        links.lastPage = '/reviews?page=' + lastPage;
      }
      if (pageNumber > 1) {
        links.prevPage = '/reviews?page=' + (pageNumber - 1);
        links.firstPage = '/reviews?page=1';
      }
      res.status(200).json(reviewsInfo);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Error fetching reviews list."
      });
    });
});

/*
 * Executes a MySQL query to fetch all reviews for a specified beer, based
 * on the beer's ID. Returns a Promise that resolves to an array
 * containing the requested reviews. This array could be empty if the
 * specified beer does not have any reviews. This function does not verify
 * that the specified beer ID corresponds to a valid beer.
 */
function getReviewsByBeerID(beerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM reviews WHERE beerid = ?',
      [ beerID ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

/*
 * Executes a MySQL query to fetch all reviews by a specified user, based on
 * on the user's ID.  Returns a Promise that resolves to an array containing
 * the requested reviews.  This array could be empty if the specified user
 * does not have any reviews.  This function does not verify that the specified
 * user ID corresponds to a valid user.
 */
function getReviewsByUserID(userID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM reviews WHERE userid = ?',
      [ userID ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

/*
mySQL query to get total number of reviews:
*/
function getReviewsCount(mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT COUNT(*) AS count FROM reviews',
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count);
        }
      }
    );
  });
}

/*
mySQL query to get reviews to list:
*/
function getReviewsPage(page, count, mysqlPool) {
  return new Promise((resolve, reject) => {
    const numPerPage = 10;
    const lastPage = Math.ceil(count / numPerPage);
    page = page < 1 ? 1 : page;
    page = page > lastPage ? lastPage : page;
    const offset = (page - 1) * numPerPage;
    mysqlPool.query(
      'SELECT * FROM reviews ORDER BY id LIMIT ?,?',
      [ offset, numPerPage ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve({
            reviews: results,
            pageNumber: page,
            totalPages: lastPage,
            pageSize: numPerPage,
            totalCount: count
          });
        }
      }
    );
  });
}

exports.router = router;
exports.getReviewsByBeerID = getReviewsByBeerID;
exports.getReviewsByUserID = getReviewsByUserID;
