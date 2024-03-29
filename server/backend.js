//Asking for the cloudant nodejs module and the URL needed to connect to the Cloudant instance.
//List of needed modules
var express = require("express")
var app = express();
var nodeCache = require("node-cache");
var myCache = new nodeCache();
var Cloudant = require("cloudant");
var dbURL = "https://3656a298-714c-4c80-8e15-51f09b165d47-bluemix:a9ae2046ce73e20fa8862aa5d552979359bc2d0e20cd6d084128003de8719ad1@3656a298-714c-4c80-8e15-51f09b165d47-bluemix.cloudant.com:443";
var connectionStatus = false;
//This is making the connection to desired Cloudant instance using a cloudant module function "Cloudant()" with a callback containing an error code or the connection saved to a variable.
var connection = Cloudant(dbURL, function(error, connection) {
  if (!error) {
    connectionStatus = true;
    console.log("connection successful");
  } else {
    console.log(error.message);
  }
});
//Selecting the database to use through the previous callbacks connection variable and storing it.
var databaseToQuery = connection.db.use("questions");
//Allows cross origin requests, security feature that prevents requests coming from unauthorised servers.
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
}

app.use(allowCrossDomain);
//ASYNC Calls backs
//function writes to the databsase the information fromthe rnli debrief form
app.post("/rnli/:timestamp/:responseTime/:location/:issue", function(req, res) {
  databaseToQuery = connection.db.use("responses");
	console.log(JSON.stringify(req.params));
  databaseToQuery.insert({
      "timestamp": req.params.timestamp,
      "responseTime": req.params.responseTime,
      "location": req.params.location,
      "issue": req.params.issue
    },
    function(error, body, header) {
      if (error) return console.log(error);
      //sending the result back as the response in json format.
      console.log("inserted Data");
      console.log(body)
			res.sendStatus(200);
    });
});
//retrieves the questions for the evaluation and caches them should they be accessed again.updates chace everytime its called.
app.get("/questions", function(req, res) {
  databaseToQuery.find({
  "selector": {
    "id": {
      "$and":[{"$gt":0},{"$ne":"contents"}]

    }
  }
},
    function(error, data) {
      if (error) return console.log(error);
      //sending the result back as the response in json format.
      console.log(data.docs);
      res.send(data.docs);
      myCache.set("questions", data.docs, function(error, success) {
        if (success) {
          console.log("questions been cached");
        }
      })
    });
});
//retrieves the list of contents pages
app.get("/contents", function(req, res) {
  databaseToQuery.find({
      "selector": {
        "id": "contents"
      }
    },
    function(error, data) {
      if (error) return console.log(error);
      //sending the result back as the response in json format.
      console.log(data.docs);
      res.send(data.docs);
    });
});

app.listen(3000);
