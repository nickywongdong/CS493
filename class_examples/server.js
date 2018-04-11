var express = require('express');
var app = express();
var port = process.env.PORT || 8000;

app.get('/', function (req, res, next) {
  res.status(200).send("Status 200\n");
});

app.get('/lodgings/:lodgingID', function (req, res, next) {
  console.log("  -- req.params:", req.params);
  res.status(200).end();
});

app.get('*', function (req, res, next) {
  res.status(404).json({
    err: "Path " + req.url + " does not exist"
  });
});

app.listen(port, function() {
  console.log("== Server is running on port", port);
});
