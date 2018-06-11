const router = require('express').Router();
const validation = require('../lib/validation');
const { getReviewsByBeerID } = require('./reviews');
const { getphotosByBeerID } = require('./photos');
const { getManufacturerByBeerID } = require('./manufacturer');


/*
 * Schema describing required/optional fields of a beer object.
 */
const beerSchema = {
  manufacturerid: { required: true },
  name: { required: true },
  abv: { required: true },
  ibu: { required: true },
  calories: { required: true },
  type: { required: true }
};

/*
 * Executes a MySQL query to fetch the total number of Beer.  Returns
 * a Promise that resolves to this count.
 */
function getBeerCount(mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT COUNT(*) AS count FROM beers', function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0].count);
      }
    });
  });
}

/*
 * Executes a MySQL query to return a single page of Beer.  Returns a
 * Promise that resolves to an array containing the fetched page of Beer.
 */
function getBeerPage(page, totalCount, mysqlPool) {
  return new Promise((resolve, reject) => {
    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
    const numPerPage = 10;
    const lastPage = Math.max(Math.ceil(totalCount / numPerPage), 1);
    page = page < 1 ? 1 : page;
    page = page > lastPage ? lastPage : page;
    const offset = (page - 1) * numPerPage;

    mysqlPool.query(
      'SELECT * FROM beers ORDER BY id LIMIT ?,?',
      [ offset, numPerPage ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve({
            beer: results,
            pageNumber: page,
            totalPages: lastPage,
            pageSize: numPerPage,
            totalCount: totalCount
          });
        }
      }
    );
  });
}

/*
 * Route to return a paginated list of beers.
 */
router.get('/', function (req, res) {
  const mysqlPool = req.app.locals.mysqlPool;
  getBeerCount(mysqlPool)
    .then((count) => {
      return getBeerPage(parseInt(req.query.page) || 1, count, mysqlPool);
    })
    .then((BeerPageInfo) => {
      /*
       * Generate HATEOAS links for surrounding pages and then send response.
       */
      BeerPageInfo.links = {};
      let { links, pageNumber, totalPages } = BeerPageInfo;
      if (pageNumber < totalPages) {
        links.nextPage = `/beer?page=${pageNumber + 1}`;
        links.lastPage = `/beer?page=${totalPages}`;
      }
      if (pageNumber > 1) {
        links.prevPage = `/beer?page=${pageNumber - 1}`;
        links.firstPage = '/beer?page=1';
      }
      res.status(200).json(BeerPageInfo);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Error fetching Beer list.  Please try again later."
      });
    });
});

/*
 * Executes a MySQL query to insert a new beer into the database.  Returns
 * a Promise that resolves to the ID of the newly-created beer entry.
 */
function insertNewBeer(beer, mysqlPool) {
  return new Promise((resolve, reject) => {
    beer = validation.extractValidFields(beer, beerSchema);
    beer.id = null;
    mysqlPool.query(
      'INSERT INTO beers SET ?',
      beer,
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
 * Route to create a new beer.
 */
router.post('/', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  if (validation.validateAgainstSchema(req.body, beerSchema)) {
    insertNewBeer(req.body, mysqlPool)
      .then((id) => {
        res.status(201).json({
          id: id,
          links: {
            beer: `/beers/${id}`
          }
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: "Error inserting beer into DB.  Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid beer object."
    });
  }
});

/*
 * Executes a MySQL query to fetch information about a single specified
 * beer based on its ID.  Returns a Promise that resolves to an object
 * containing information about the requested beer.  If no beer with
 * the specified ID exists, the returned Promise will resolve to null.
 */
function getBeerByID(beerID, mysqlPool) {
  /*
   * Execute three sequential queries to get all of the info about the
   * specified beer, including its reviews and manufacturer.  If the original
   * request to fetch the beer doesn't match a beer, send null through
   * the promise chain.
   */
  let returnBeer = {};
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM beers WHERE id = ?', [ beerID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  }).then((beer) => {
    if (beer) {
      returnBeer = beer;
      return getReviewsByBeerID(beerID, mysqlPool);
    } else {
      return Promise.resolve(null);
    }
  }).then((reviews) => {
    if (reviews) {
      returnBeer.reviews = reviews;
      return getphotosByBeerID(beerID, mysqlPool);
    } else {
      return Promise.resolve(null);
    }
  }).then((photos) => {
    if (photos) {
      returnBeer.photos = photos;
      return getManufacturerByBeerID(beerID, mysqlPool);
    } else {
      return Promise.resolve(null);
    }
  }).then((manufacturer) => {
    if (manufacturer) {
      returnBeer.manufacturer = manufacturer;
      return Promise.resolve(returnBeer);
    } else {
      return Promise.resolve(null);
    }
  })
}

/*
 * Route to fetch info about a specific beer.
 */
router.get('/:beerID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const beerID = parseInt(req.params.beerID);
  getBeerByID(beerID, mysqlPool)
    .then((beer) => {
      if (beer) {
        res.status(200).json(beer);
      } else {
        next();
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Unable to fetch beer.  Please try again later."
      });
    });
});

/*
 * Executes a MySQL query to replace a specified beer with new data.
 * Returns a Promise that resolves to true if the beer specified by
 * `beerID` existed and was successfully updated or to false otherwise.
 */
function replaceBeerByID(beerID, beer, mysqlPool) {
  return new Promise((resolve, reject) => {
    beer = validation.extractValidFields(beer, beerSchema);
    mysqlPool.query('UPDATE beers SET ? WHERE id = ?', [ beer, beerID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });
}

/*
 * Route to replace data for a beer.
 */
router.put('/:beerID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const beerID = parseInt(req.params.beerID);
  if (validation.validateAgainstSchema(req.body, beerSchema)) {
    replaceBeerByID(beerID, req.body, mysqlPool)
      .then((updateSuccessful) => {
        if (updateSuccessful) {
          res.status(200).json({
            links: {
              beer: `/beer/${beerID}`
            }
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Unable to update specified beer.  Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid beer object"
    });
  }
});

/*
 * Executes a MySQL query to delete a beer specified by its ID.  Returns
 * a Promise that resolves to true if the beer specified by `beerID`
 * existed and was successfully deleted or to false otherwise.
 */
function deleteBeerByID(beerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('DELETE FROM beers WHERE id = ?', [ beerID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });

}

/*
 * Route to delete a beer.
 */
router.delete('/:beerID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const beerID = parseInt(req.params.beerID);
  deleteBeerByID(beerID, mysqlPool)
    .then((deleteSuccessful) => {
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to delete beer.  Please try again later."
      });
    });
});

/*
 * Executes a MySQL query to fetch all Beer distributed by a specified manufacturer,
 * based on on the manufacturer's ID.  Returns a Promise that resolves to an array
 * containing the requested beers.  This array could be empty if the
 * specified manufacturer does not distribute any beer.  This function does not verify
 * that the specified manufacturer ID corresponds to a valid manufacturer.
 */
function getBeerByManufacturerID(manufacturerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM beers WHERE manufacturerid = ?',
      [ manufacturerid ],
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

exports.router = router;
exports.getBeerByManufacturerID = getBeerByManufacturerID;
