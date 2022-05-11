const express = require('express');
require('./dbServer'); 
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;

// Import routes
var apiRouter = require('./routes/apiRouter');
const { basicAuth } = require('./basicAuth');

// Inititalize the app and add middleware
app.set('view engine', 'pug'); // Setup the pug
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public')); // Static files to serve CSS file
app.use(bodyParser.urlencoded({extended: true})); // Setup the body parser to handle form submits
app.use(session({ 
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
})); // Session setup

// use basic HTTP auth to secure the api
app.use(basicAuth);

// Add the routes to middleware chain
app.use('/api/task', apiRouter);

/** App listening on port */
app.listen(port, () => {
  console.log(`Task Management System listening at http://localhost:${port}`);
});