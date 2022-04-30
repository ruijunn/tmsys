const express = require('express');
require('./dbServer'); 
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3000;

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

// Inititalize the app and add middleware
app.set('view engine', 'pug'); // Setup the pug
app.use(express.json()); // parses incoming JSON requests and puts the parsed data in req.body
app.use(express.static(__dirname + '/public')); // Static files to serve CSS file
app.use(bodyParser.urlencoded({extended: true})); // Setup the body parser to handle form submits
app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
app.use(session({secret: 'super-secret'})); // Session setup

// Add the routes to middleware chain
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