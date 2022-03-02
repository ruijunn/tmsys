const express = require('express');
const router  = express.Router();
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Inititalize the app and add middleware
app.set('view engine', 'pug'); // Setup the pug
app.use(bodyParser.urlencoded({extended: true})); // Setup the body parser to handle form submits
app.use(session({secret: 'super-secret'})); // Session setup

/* Database connection */
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "nodelogin"
});
  
conn.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
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
    var sql = "SELECT * FROM accounts WHERE username = ? AND password = ?";
    conn.query(sql, [username, password], function (error, results, fields) {
		  if (error) throw error; // If there is an issue with the query, output the error
		  if (results.length > 0) {   // If the account exists
			  // Authenticate the user
			  req.session.isLoggedIn = true;
			  req.session.username = username;
        console.log("Login Successful!");
        res.redirect('/');  // redirect to index page
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
  res.redirect('/');
}); 

/** Simulated bank functionality */
app.get('/', (req, res) => {
  res.render('index', {isLoggedIn: req.session.isLoggedIn});
}); 

/** Handle create user function */
app.get('/createUser', (req, res) => {
  res.render('createUser', {isLoggedIn: req.session.isLoggedIn});
});

app.post('/createUser', (req, res) => {
  const {username, password, email} = req.body;
  if (username && password && email) { // check input fields are not empty
		var sql = "INSERT INTO accounts (username, password, email) VALUES (?, ?, ?)";
    conn.query(sql, [username, password, email], function (error, result) {
      if (error) throw error; // If there is an issue with the query, output the error
      console.log("New user created successfully!");
      res.redirect('/'); // redirect to index page
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

/* app.post('/changePassword', (req, res) => {
  const {password} = req.body;
  if (password) { // check input fields are not empty
		var sql = "UPDATE accounts SET password = ? WHERE username = ?"; // update user password based on username
    conn.query(sql, [password, req.session.username], function (error, result) {
      if (error) throw error; // If there is an issue with the query, output the error
      console.log("Password updated successfully!");
      res.redirect('/'); // redirect to index page
    });
  }
  else {
    res.render('updateEmail', {error: 'Failed to update password!'});
  }
});   */

/** Handle update email function */
app.get('/updateEmail', (req, res) => {
  res.render('updateEmail', {isLoggedIn: req.session.isLoggedIn});
});

app.post('/updateEmail', (req, res) => {
  const {email} = req.body;
  if (email) { // check input fields are not empty
		var sql = "UPDATE accounts SET email = ? WHERE username = ?"; // update user email based on username
    conn.query(sql, [email, req.session.username], function (error, result) {
      if (error) throw error; // If there is an issue with the query, output the error
      console.log("Email updated successfully!");
      res.redirect('/'); // redirect to index page
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