const express = require('express');
const mysql = require('mysql'); 
require('./dbServer');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;

var loginRouter = require('./routes/login');
var accountRouter = require('./routes/account');
var userRouter = require('./routes/user');

// Inititalize the app and add middleware
app.set('view engine', 'pug'); // Setup the pug
app.use(express.static(__dirname + '/public')); // Static files
app.use(bodyParser.urlencoded({extended: true})); // Setup the body parser to handle form submits
app.use(session({secret: 'super-secret'})); // Session setup

app.use('/', loginRouter);
app.use('/', accountRouter);
app.use('/', userRouter);

/* Database connection */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

/** Display home page */
app.get('/home', (req, res) => {
  res.render('index', {isLoggedIn: req.session.isLoggedIn});
}); 

/** Display change password page */
app.get('/changePassword', (req, res) => {
  res.render('changePassword', {isLoggedIn: req.session.isLoggedIn});
});

/** Handle change password function */
app.post('/changePassword', (req, res) => {
  const {currentpwd, newpwd} = req.body;
  const hashedPwd2 = bcrypt.hashSync(newpwd,bcrypt.genSaltSync(10)); // store hash in database
  if (currentpwd && newpwd) { // check input fields are not empty
    if (currentpwd === newpwd) { // check if current pwd is the same as new pwd
      res.render('changePassword', {error: 'Current password cannot be the same as new password!'});
    }
    else {
      // update user current password with new encrypted password based on user id
      const sql = "UPDATE accounts SET password = ? WHERE id = ?";
      db.query(sql, [hashedPwd2, req.session.userID], function (error, result) {
        if (error) throw error; 
        res.render('changePassword', {success: 'Password updated successfully!'});
      });
    }
  }
  else {
    res.render('changePassword', {error: 'Please enter current password and new password!'});
  }
}); 

/** Display update email page */
app.get('/updateEmail', (req, res) => {
  res.render('updateEmail', {isLoggedIn: req.session.isLoggedIn});
});

/** Handle update email function */
app.post('/updateEmail', (req, res) => {
  const {email} = req.body;
  if (email) { // check if email is not empty
		const sql = "UPDATE accounts SET email = ? WHERE id = ?"; 
    db.query(sql, [email, req.session.userID], function (error, result) {
      if (error) throw error; 
      res.render('updateEmail', {success: 'Email updated successfully!'});
    });
  }
  else {
    res.render('updateEmail', {error: 'Please enter an email address!'});
  }
});  

/** App listening on port */
app.listen(port, () => {
  console.log(`Task Management System listening at http://localhost:${port}`);
});