const express = require('express');
const mysql = require('mysql'); 
require('./dbServer');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;

// Inititalize the app and add middleware
app.set('view engine', 'pug'); // Setup the pug
app.use(bodyParser.urlencoded({extended: true})); // Setup the body parser to handle form submits
app.use(session({secret: 'super-secret'})); // Session setup

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_PORT = process.env.DB_PORT;

/* Database connection */
var conn = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT
});
 
/** Handle login display and form submit */
app.get('/login', (req, res) => {
  if (req.session.isLoggedIn === true) {
    return res.redirect('/');
  }
  res.render('login', {error: false});
});

app.post('/login', (req, res) => {
  const {username, password} = req.body;
  if (username && password) { // check input fields are not empty
	  // retrieve account from the database based on the specified username and password
    var sql = "SELECT * FROM accounts WHERE username = ?";
    conn.query(sql, [username], function (error, results, fields) {
		  if (error) throw error; // If there is an issue with the query, output the error
		  if (results.length > 0) {   // If the account exists
        // compare entered password with the stored encrypted password
        var test = bcrypt.compareSync(password, results[0].password); 
        console.log(test); // true
        // Authenticate the user
			  req.session.isLoggedIn = true;
			  req.session.username = username;
        req.session.userID = results[0].id;
        var userid = req.session.userID;
        console.log("Login Successful!");
        console.log(userid);
        res.redirect('/'); // redirect to index page
		  } else {
        res.render('login', {error: 'Incorrect Username and/or Password!'});
		  }			
		  res.end();
	  });
	} else {
    res.render('login', {error: 'Please enter Username and Password!'});
	}
}); 

/** Handle logout function */
app.get('/logout', (req, res) => {
  req.session.isLoggedIn = false;
  console.log("Logout Successful!")
  res.redirect('/');
}); 

/** Simulated app functionality */
app.get('/', (req, res) => {
  res.render('index', {isLoggedIn: req.session.isLoggedIn});
}); 

/** Handle create user function */
app.get('/createUser', (req, res) => {
  var sql = "SELECT role FROM accounts WHERE id = ?";
  conn.query(sql, [req.session.userID], function (error, results, fields) {
    if (error) throw error;
    if (results.length > 0) {
      if (results[0].role === "admin") { // check if role is admin
        console.log("User is an admin");
        res.render('createUser', {isLoggedIn: req.session.isLoggedIn});
      }
      else if (results[0].role === "user") { // check if role is user
        console.log("User is not an admin, not authorized!");
        res.redirect('/'); // redirect to index page
      }
      else { // check if user does not belong to any group
        console.log("User is not part of the group!");
        res.redirect('/'); // redirect to index page
      }
    }
  });
});

app.post('/createUser', (req, res) => {
  const {username, password, email, grpName} = req.body;
  const hashedPwd = bcrypt.hashSync(password,bcrypt.genSaltSync(10)); // store hash in database
  if (username && password && email && grpName) { // check input fields are not empty
    // insert username, hashedpwd and email to database
		var sql = "INSERT INTO accounts (username, password, email, role) VALUES (?, ?, ?, ?)";
    conn.query(sql, [username, hashedPwd, email, grpName], function (error, result) {
      if (error) throw error; // If there is an issue with the query, output the error
      res.render('createUser', {success: 'New user created successfully!'});
    });
  }
  else {
    res.render('createUser', {error: 'Please enter all user details!'});
  }
}); 
 
/** Handle change password function */
app.get('/changePassword', (req, res) => {
  res.render('changePassword', {isLoggedIn: req.session.isLoggedIn});
});

app.post('/changePassword', (req, res) => {
  const {currentpwd, newpwd} = req.body;
  const hashedPwd2 = bcrypt.hashSync(newpwd,bcrypt.genSaltSync(10)); // store hash in database
  if (currentpwd && newpwd) { // check input fields are not 
    if (currentpwd == newpwd) { 
      res.render('changePassword', {error: 'Current password cannot be the same as new password!'});
    }
    else {
      // update user current password with new encrypted password based on username
      var sql = "UPDATE accounts SET password = ? WHERE id = ?";
      conn.query(sql, [hashedPwd2, req.session.userID], function (error, result) {
        if (error) throw error; // If there is an issue with the query, output the error
        res.render('changePassword', {success: 'Password updated successfully!'});
      });
    }
  }
  else {
    res.render('changePassword', {error: 'Please enter current password and new password!'});
  }
}); 


/** Handle update email function */
app.get('/updateEmail', (req, res) => {
  res.render('updateEmail', {isLoggedIn: req.session.isLoggedIn});
});

app.post('/updateEmail', (req, res) => {
  const {email} = req.body;
  if (email) { // check input fields are not empty
		var sql = "UPDATE accounts SET email = ? WHERE id = ?"; // update user email based on username
    conn.query(sql, [email, req.session.userID], function (error, result) {
      if (error) throw error; // If there is an issue with the query, output the error
      res.render('updateEmail', {success: 'Email updated successfully!'});
    });
  }
  else {
    res.render('updateEmail', {error: 'Failed to update email!'});
  }
});  

/** App listening on port */
app.listen(port, () => {
  console.log(`Task Management System listening at http://localhost:${port}`);
});