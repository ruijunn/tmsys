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

/* Database connection */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

/** Handle login display and form submit */
app.get('/', (req, res) => {
  if (req.session.isLoggedIn === true) {
    return res.redirect('/home');
  }
  res.render('login', {error: false}); 
});

app.post('/login', (req, res) => {
  const {username, password} = req.body;
  if (username && password) { // check input fields are not empty
	  // retrieve account from the database based on the specified username and password
    var sql = "SELECT * FROM accounts WHERE username = ?";
    db.query(sql, [username], function (error, results, fields) {
		  if (error) throw error; // If there is an issue with the query, output the error
		  if (results.length > 0) {   // If the account exists
        // compare entered password with the stored encrypted password
        const validPwd = bcrypt.compareSync(password, results[0].password); 
        console.log(validPwd); // true
        if (validPwd) {
          if (results[0].status === 1) { // status = 1 means account is active
            // Authenticate the user
            req.session.isLoggedIn = true;
            req.session.username = username; // store the username in session
            req.session.userID = results[0].id; // store the id in session
            const userid = req.session.userID;
            console.log("Login Successful!");
            console.log(userid);
            res.redirect('/home') // redirect to index page
          }
          else { // status = 0 means account is disabled
            res.render('login', {error: 'Your account has been disabled!'});
          }
        }
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
app.get('/home', (req, res) => {
  res.render('index', {isLoggedIn: req.session.isLoggedIn});
}); 

/** Handle create user function */
app.get('/createUser', (req, res) => {
  const sql = "SELECT role FROM accounts WHERE id = ?";
  db.query(sql, [req.session.userID], function (error, results, fields) {
    if (error) throw error;
    if (results.length > 0) {
      if (results[0].role === "admin") { // check if role is admin
        console.log("User is an admin");
        res.render('createUser', {isLoggedIn: req.session.isLoggedIn}); // redirect to create user page
      }
      else { // check if role is user
        console.log("User is not an admin, not authorized!");
        res.redirect('/home'); // redirect to index page
      }
    }
  });
});

app.post('/createUser', (req, res) => {
  const {username, password, email, grpName} = req.body;
  const hashedPwd = bcrypt.hashSync(password,bcrypt.genSaltSync(10)); // store hash in database
  if (username && password && email && grpName) { // check input fields are not empty
    // insert username, hashedpwd and email to database
		const sql = "INSERT INTO accounts (username, password, email, role) VALUES (?, ?, ?, ?)";
    db.query(sql, [username, hashedPwd, email, grpName], function (error, result) {
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
      const sql = "UPDATE accounts SET password = ? WHERE id = ?";
      db.query(sql, [hashedPwd2, req.session.userID], function (error, result) {
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
		const sql = "UPDATE accounts SET email = ? WHERE id = ?"; // update user email based on username
    db.query(sql, [email, req.session.userID], function (error, result) {
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