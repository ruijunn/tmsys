const express = require('express');
require('./dbServer'); 
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT;

// Import routes
var loginRouter = require('./routes/login');
var indexRouter = require('./routes/index');
var accountRouter = require('./routes/account');
var userRouter = require('./routes/user');
var groupRouter = require('./routes/group');
var taskRouter = require('./routes/task');
var applicationRouter = require('./routes/application');
var planRouter = require('./routes/plan');
var leftFrameRouter = require('./routes/leftFrame');
var apiRouter = require('./routes/apiRouter');
const { basicAuth } = require('./basicAuth'); 

// Inititalize the app and add middleware
app.set('view engine', 'pug'); // Setup the pug
app.use(express.json()); // parses incoming JSON requests and puts the parsed data in req.body
app.use(express.static(__dirname + '/public')); // Static files to serve CSS file
app.use(bodyParser.urlencoded({extended: true})); // Setup the body parser to handle form submits
app.use(session({ 
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
})); // Session setup

// Add the routes to middleware chain
app.use('/api/task', basicAuth, apiRouter); // use basic HTTP auth to secure the api => middleware to authenticate before apiRouter
app.use('/', loginRouter);
app.use('/', indexRouter);
app.use('/', accountRouter);
app.use('/', userRouter);
app.use('/', groupRouter);
app.use('/', taskRouter);
app.use('/', applicationRouter);
app.use('/', planRouter);
app.use('/', leftFrameRouter);

/** App listening on port */
app.listen(port, () => {
  console.log(`Task Management System listening at http://localhost:${port}`);
});