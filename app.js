const express = require('express');
const mysql = require('mysql'); 
require('./dbServer'); 
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Import routes
var loginRouter = require('./routes/login');
var indexRouter = require('./routes/index');
var accountRouter = require('./routes/account');
var userRouter = require('./routes/user');

// Inititalize the app and add middleware
app.set('view engine', 'pug'); // Setup the pug
app.use(express.static(__dirname + '/public')); // Static files to serve CSS file
app.use(bodyParser.urlencoded({extended: true})); // Setup the body parser to handle form submits
app.use(session({secret: 'super-secret'})); // Session setup

// Add the routes to middleware chain
app.use('/', loginRouter);
app.use('/', indexRouter);
app.use('/', accountRouter);
app.use('/', userRouter);

/* Database connection */
mysql.createConnection ( {
  connectionLimit : 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

/** App listening on port */
app.listen(port, () => {
  console.log(`Task Management System listening at http://localhost:${port}`);
});