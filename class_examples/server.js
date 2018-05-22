var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 8000;

app.use(bodyParser.json);

app.use(function (req, res, next) {
  console.log("== Got request:");
  console.log("  -- URL:", req.url);
  console.log("  -- method: ", req.method);
  next();
});

app.get('/', function (req, res, next) {
  res.status(200).send("Status 200\n");
});

app.get('/lodgings', function (req, res) {
  console.log("  --req.query:", req.query);
  var page = parseInt(req.query.page) || 1;
  var numPerPage = 10;
  var lastPage = Math.ceil(lodgings.length / numPerPage);
  //make usre page is in bounds:
  page = page < 1 ? 1 : page;   //if page < 1, use value 1, otherwise use page.
  page = page > lastPage ? lastPage : page;

  var start = (page - 1) * numPerPage;
  var end = start + numPerPage;
  //slize takes an array, and returns a subarray
  var pageLodgings = lodgings.slice(start, end);  //grabs from start and immediately before index end

  var links = {};
  if (page < lastPage) {
    links.nextPage = '/lodgings?page=' + (page + 1 );
    links.lastPage = '/lodgings?page=' + lastPage;
  }
  if (page > 1) {
    links.prevPage = '/lodgings?page=' + (page - 1 );
    links.lastPage = '/lodgings?page=';
  }

  res.status(200).json({
    lodgings: pageLodgings,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: lodgings.length
  });
});

app.post('/lodgings', function (req, res, next) {
  console.log(" -- req.body:", req.body);
  if (req.body && req.body.name && req.body.price) {
    lodgings.push(req.body);
    var id = lodgings.length-1;
    res.status(201).json({
      id: id,
      links: {
        lodging: '/lodgings/' + id
      }
    });
  } else {
    res.status(400).json({
      err: "Request needs a JSON body with a name and a price"
    });
  }
  next();
});



function verifyLodgingID(lodgingID) {
  return lodgingID && lodgingID > 0 && lodgingID < lodgings.length || lodgingID === 0;
}


app.get('/lodgings/:lodgingID', function (req, res, next) {
  console.log("  -- req.params:", req.params);
  var lodgingID = parseInt(req.params.lodgingID);
  if(verifyLodgingID(lodgingID) && lodgings[lodgingID]) {

  }
  res.status(200).end();
});

app.put('/lodgings/:lodgingID', function (req, req, next) {
  var lodgingID = parseInt(req.params.lodgingID);
  if (lodgings[lodgingID]) {
    if(req.body && req.body.name && req.body.price) {
      lodgings[lodgingID] = req.body;
      res.status(200).json({
        links: {
          lodging:
        }
      })
    }
  }
})

app.get('*', function (req, res, next) {
  res.status(404).json({
    err: "Path " + req.url + " does not exist"
  });
});

app.listen(port, function() {
  console.log("== Server is running on port", port);
});
