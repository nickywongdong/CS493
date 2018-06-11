const router = require('express').Router();
const validation = require('../lib/validation');

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoschema = {
  userid: { required: true },
  beerid: { required: true },
  caption: { required: true },
  filename: { required: true }
};

/*
 * Executes a MySQL query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
function insertNewphoto(photo, mysqlPool) {
  return new Promise((resolve, reject) => {
    photo = validation.extractValidFields(photo, photoschema);
    photo.id = null;
    console.log(photo);
    mysqlPool.query(
      'INSERT INTO photos SET ?',
      photo,
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
 * Route to create a new photo.
 */
router.post('/', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  if (validation.validateAgainstSchema(req.body, photoschema)) {
    /*
     * Make sure the user is not trying to photo the same business twice.
     * If they're not, then insert their photo into the DB.
     */
    insertNewphoto(req.body, mysqlPool)
      .then((id) => {
        res.status(201).json({
          id: id,
          links: {
            photo: `/photos/${id}`,
            beer: `/beer/${req.body.beerid}`
          }
        });
      })
  } else {
    res.status(400).json({
      error: "Request body is not a valid photo object."
    });
  }
});

/*
 * Executes a MySQL query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
function getphotoByID(photoID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM photos WHERE id = ?', [ photoID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const photoID = parseInt(req.params.photoID);
  getphotoByID(photoID, mysqlPool)
    .then((photo) => {
      if (photo) {
        res.status(200).json(photo);
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch photo.  Please try again later."
      });
    });
});

/*
 * Executes a MySQL query to replace a specified photo with new data.
 * Returns a Promise that resolves to true if the photo specified by
 * `photoID` existed and was successfully updated or to false otherwise.
 */
function replacephotoByID(photoID, photo, mysqlPool) {
  return new Promise((resolve, reject) => {
    photo = validation.extractValidFields(photo, photoschema);
    mysqlPool.query('UPDATE photos SET ? WHERE id = ?', [ photo, photoID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });
}

/*
 * Route to update a photo.
 */
router.put('/:photoID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const photoID = parseInt(req.params.photoID);
  if (validation.validateAgainstSchema(req.body, photoschema)) {
    let updatedphoto = validation.extractValidFields(req.body, photoschema);
    /*
     * Make sure the updated photo has the same businessID and userID as
     * the existing photo.  If it doesn't, respond with a 403 error.  If the
     * photo doesn't already exist, respond with a 404 error.
     */
    getphotoByID(photoID, mysqlPool)
      .then((existingphoto) => {
        if (existingphoto) {
          if (updatedphoto.beerid === existingphoto.beerid && updatedphoto.userid === existingphoto.userid) {
            return replacephotoByID(photoID, updatedphoto, mysqlPool);
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
              beer: `/beer/${updatedphoto.beerid}`,
              photo: `/photos/${photoID}`
            }
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        if (err === 403) {
          res.status(403).json({
            error: "Updated photo must have the same beerID and userID"
          });
        } else {
          res.status(500).json({
            error: "Unable to update photo.  Please try again later."
          });
        }
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid photo object."
    });
  }
});

/*
 * Executes a MySQL query to delete a photo specified by its ID.  Returns
 * a Promise that resolves to true if the photo specified by `photoID`
 * existed and was successfully deleted or to false otherwise.
 */
function deletephotoByID(photoID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('DELETE FROM photos WHERE id = ?', [ photoID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });

}

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const photoID = parseInt(req.params.photoID);
  deletephotoByID(photoID, mysqlPool)
    .then((deleteSuccessful) => {
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to delete photo.  Please try again later."
      });
    });
});


/*
* Route to list photos:
*/

 router.get('/', function (req, res) {
  const mysqlPool = req.app.locals.mysqlPool;

  getphotosCount(mysqlPool)
    .then((count) => {
      return getphotosPage(parseInt(req.query.page) || 1, count, mysqlPool);
    })
    .then((photosInfo) => {
      photosInfo.links = {};
      let { links, lastPage, pageNumber } = photosInfo;
      if (pageNumber < lastPage) {
        links.nextPage = '/photos?page=' + (pageNumber + 1);
        links.lastPage = '/photos?page=' + lastPage;
      }
      if (pageNumber > 1) {
        links.prevPage = '/photos?page=' + (pageNumber - 1);
        links.firstPage = '/photos?page=1';
      }
      res.status(200).json(photosInfo);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Error fetching photos list."
      });
    });
});

/*
 * Executes a MySQL query to fetch all photos for a specified beer, based
 * on the beer's ID. Returns a Promise that resolves to an array
 * containing the requested photos. This array could be empty if the
 * specified beer does not have any photos. This function does not verify
 * that the specified beer ID corresponds to a valid beer.
 */
function getphotosByBeerID(beerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM photos WHERE beerid = ?',
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
 * Executes a MySQL query to fetch all photos by a specified user, based on
 * on the user's ID.  Returns a Promise that resolves to an array containing
 * the requested photos.  This array could be empty if the specified user
 * does not have any photos.  This function does not verify that the specified
 * user ID corresponds to a valid user.
 */
function getphotosByUserID(userID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM photos WHERE userid = ?',
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
mySQL query to get total number of photos:
*/
function getphotosCount(mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT COUNT(*) AS count FROM photos',
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
mySQL query to get photos to list:
*/
function getphotosPage(page, count, mysqlPool) {
  return new Promise((resolve, reject) => {
    const numPerPage = 10;
    const lastPage = Math.ceil(count / numPerPage);
    page = page < 1 ? 1 : page;
    page = page > lastPage ? lastPage : page;
    const offset = (page - 1) * numPerPage;
    mysqlPool.query(
      'SELECT * FROM photos ORDER BY id LIMIT ?,?',
      [ offset, numPerPage ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve({
            photos: results,
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
exports.getphotosByBeerID = getphotosByBeerID;
exports.getphotosByUserID = getphotosByUserID;

