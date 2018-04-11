var express = require('express');
var app = express();
var port = process.env.PORT || 8000;

app.get('/lodgings', function (req, res, next) {
  res.status(200).send("Status 200!\n");
});

app.listen(port, function() {
  console.log("== Server is running on port", port);
});
