const router = require('express').Router();
const validation = require('../lib/validation');

const { getBeerByID } = require('./beer');

/*
 * Schema describing required/optional fields of a manufacturer object.
 */
const manufacturerSchema = {
  beerid: {requred: true },
  name: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phonenumber: { required: true },
};

/*
 * Executes a MySQL query to fetch a manufacturer based on beer ID.
 * Returns a Promise that resolves to an object containing the requested
 * manufacturer.  If no manufacturer with the specified beer ID exists, the returned Promise
 * will resolve to null.
 */
function getManufacturerByBeerID(beerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM manufacturers WHERE beerid = ?', [ beerID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

/*
 * Executes a MySQL query to fetch the total number of manufacturer. Returns
 * a Promise that resolves to this count.
 */
function getManufacturerCount(mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT COUNT(*) AS count FROM manufacturers', function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0].count);
      }
    });
  });
}

/*
 * Executes a MySQL query to return a single page of manufacturers.  Returns a
 * Promise that resolves to an array containing the fetched page of manufacturers.
 */
function getManufacturerPage(page, totalCount, mysqlPool) {
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
      'SELECT * FROM manufacturers ORDER BY id LIMIT ?,?',
      [ offset, numPerPage ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve({
            manufacturers: results,
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
 * Route to return a paginated list of manufacturers.
 */
router.get('/', function (req, res) {
  const mysqlPool = req.app.locals.mysqlPool;
  getManufacturerCount(mysqlPool)
    .then((count) => {
      return getManufacturerPage(parseInt(req.query.page) || 1, count, mysqlPool);
    })
    .then((ManufacturerPageInfo) => {
      /*
       * Generate HATEOAS links for surrounding pages and then send response.
       */
      ManufacturerPageInfo.links = {};
      let { links, pageNumber, totalPages } = ManufacturerPageInfo;
      if (pageNumber < totalPages) {
        links.nextPage = `/manufacturer?page=${pageNumber + 1}`;
        links.lastPage = `/manufacturer?page=${totalPages}`;
      }
      if (pageNumber > 1) {
        links.prevPage = `/manufacturer?page=${pageNumber - 1}`;
        links.firstPage = '/manufacturer?page=1';
      }
      res.status(200).json(ManufacturerPageInfo);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Error fetching manufacturers list.  Please try again later."
      });
    });
});



/*
 * Executes a MySQL query to insert a new manufacturer into the database.  Returns
 * a Promise that resolves to the ID of the newly-created manufacturer entry.
 */
function insertNewManufacturer(manufacturer, mysqlPool) {
  return new Promise((resolve, reject) => {
    manufacturer = validation.extractValidFields(manufacturer, manufacturerSchema);
    manufacturer.id = null;
    mysqlPool.query(
      'INSERT INTO manufacturers SET ?',
      manufacturer,
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
 * Route to create a new manufacturer.
 */
router.post('/', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  if (validation.validateAgainstSchema(req.body, manufacturerSchema)) {
    insertNewManufacturer(req.body, mysqlPool)
      .then((id) => {
        res.status(201).json({
          id: id,
          links: {
            manufacturer: `/manufacturer/${id}`
          }
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Error inserting manufacturer into DB.  Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid manufacturer object."
    });
  }
});

// function getManufacturerByID(manufacturerID, mysqlPool) {
//   return new Promise((resolve, reject) => {
//     mysqlPool.query('SELECT * FROM manufacturers WHERE id = ?', [ manufacturerID ], function (err, result) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(result.affectedRows > 0);
//       }
//     });
//   });
// }

/*
 * Executes a MySQL query to fetch a single specified manufacturer based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * manufacturer.  If no manufacturer with the specified ID exists, the returned Promise
 * will resolve to null.
 */
function getManufacturerByID(manufacturerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM manufacturers WHERE id = ?', [ manufacturerID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}

/*
 * Route to fetch info about a specific manufacturer.
 */
router.get('/:manufacturerID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const manufacturerID = parseInt(req.params.manufacturerID);
  getBeerByManufacturerID(manufacturerID, mysqlPool)
    .then((manufacturer) => {
      if (manufacturer) {
        res.status(200).json(manufacturer);
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch manufacturer.  Please try again later."
      });
    });
});

/*
 * Executes a MySQL query to replace a specified manufacturer with new data.
 * Returns a Promise that resolves to true if the manufacturer specified by
 * `manufacturerID` existed and was successfully updated or to false otherwise.
 */
function replaceManufacturerByID(manufacturerID, manufacturer, mysqlPool) {
  return new Promise((resolve, reject) => {
    manufacturer = validation.extractValidFields(manufacturer, manufacturerSchema);
    mysqlPool.query('UPDATE manufacturers SET ? WHERE id = ?', [ manufacturer, manufacturerID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });
}

/*
 * Route to replace data for a manufacturer.
 */
router.put('/:manufacturerID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const manufacturerID = parseInt(req.params.manufacturerID);
  if (validation.validateAgainstSchema(req.body, manufacturerSchema)) {
    replaceManufacturerByID(manufacturerID, req.body, mysqlPool)
      .then((updateSuccessful) => {
        if (updateSuccessful) {
          res.status(200).json({
            links: {
              manufacturer: `/manufacturer/${manufacturerID}`
            }
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Unable to update specified manufacturer.  Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid manufacturer object"
    });
  }
});

/*
 * Executes a MySQL query to delete a manufacturer specified by its ID.  Returns
 * a Promise that resolves to true if the manufacturer specified by `manufacturerID`
 * existed and was successfully deleted or to false otherwise.
 */
function deleteManufacturerByID(manufacturerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('DELETE FROM manufacturers WHERE id = ?', [ manufacturerID ], function (err, result) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });
}

/*
 * Route to delete a manufacturer.
 */
router.delete('/:manufacturerID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const manufacturerID = parseInt(req.params.manufacturerID);
  deleteManufacturerByID(manufacturerID, mysqlPool)
    .then((deleteSuccessful) => {
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Unable to delete manufacturer.  Please try again later."
      });
    });
});

/*
 * Executes a MySQL query to fetch all Beers distributed by a specified manufacturer,
 * based on on the manufacturer's ID.  Returns a Promise that resolves to an array
 * containing the requested beers.  This array could be empty if the
 * specified manufacturer does not distribute any beer.  This function does not verify
 * that the specified manufacturer ID corresponds to a valid manufacturer.
 */
function getBeerByManufacturerID(manufacturerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query(
      'SELECT * FROM beers WHERE manufacturerID = ?',
      [ manufacturerID ],
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
exports.getManufacturerByBeerID = getManufacturerByBeerID;
