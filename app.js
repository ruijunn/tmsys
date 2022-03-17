const express = require('express');
const mysql = require('mysql'); 
require('./dbServer');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;

var loginRouter = require('./routes/login');

// Inititalize the app and add middleware
app.set('view engine', 'pug'); // Setup the pug
app.use(express.static(__dirname + '/public')); // Static files
app.use(bodyParser.urlencoded({extended: true})); // Setup the body parser to handle form submits
app.use(session({secret: 'super-secret'})); // Session setup

app.use('/', loginRouter);

var user;

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

/** Create a function to check if user is in a group */
function checkGroup (userid, groupname) {
  // create promise with resolve and reject as params
	return new Promise((resolve, reject) => {
    const sql = "SELECT groupName FROM usergrp WHERE id = ?";
    db.query(sql, [userid], (error, result) => {
      if (error) throw error;
      if(result.length > 0) {
        const gname = result[0].groupName;
        if (gname === groupname) {
          resolve(gname);
        }
        else {
          resolve(false);
        }
      }
    });
	})
};

/** Display Create User Page */
app.get('/createUser', (req, res) => {
  const sql = "SELECT role FROM accounts WHERE id = ?";
  db.query(sql, [req.session.userID], async function (error, results, fields) {
    if (error) throw error;
    if (results.length > 0) {
      var checkUsrGrp = await checkGroup(req.session.userID, results[0].role);
      // console.log(checkUsrGrp);
      if (checkUsrGrp) {
        if (results[0].role === "admin") { // check if role is admin
          console.log(results);
          console.log("User is an admin");
          res.render('createUser', {isLoggedIn: req.session.isLoggedIn}); // redirect to create user page
        }
        else { // check if role is user
          console.log(results);
          console.log("User is not an admin, not authorized!");
          res.redirect('/home'); // redirect to home page
        }
      } 
    }
  });
});

/** Handle create user function */
app.post('/createUser', (req, res) => {
  const {username, password, email, grpName} = req.body;
  const hashedPwd = bcrypt.hashSync(password,bcrypt.genSaltSync(10)); // store hash in database
  if (username && password && email && grpName) { // check input fields are not empty
    // check if user with given username exists or not in db
    const sql = "SELECT username FROM accounts WHERE username = ?";
    db.query(sql, [username], function(error, result) {
      if (error) throw error;
      if (result.length === 0) { // if username not exists in db, insert new user
        const sql2 = "INSERT INTO accounts (username, password, email, role, status) VALUES (?, ?, ?, ?, 1)";
        db.query(sql2, [username, hashedPwd, email, grpName], function (error, result) {
          if (error) throw error; 
          res.render('createUser', {success: 'New user created successfully!'});
        });
      }
      else { // existing user, display error message
        res.render('createUser', {error: 'Username already exists!'});
      }
    });
  }
  else {
    res.render('createUser', {error: 'Please enter all user details!'});
  }
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

/* Display user list page */
app.get('/details', function(req, res) {
  const sql = "SELECT role FROM accounts WHERE id = ?";
  db.query(sql, [req.session.userID], async function (error, results, fields) {
    if (error) throw error;
    if (results.length > 0) {
      var checkUsrGrp = await checkGroup(req.session.userID, results[0].role);
      //console.log(checkUsrGrp);
      if (checkUsrGrp) {
        if (results[0].role === "admin") { // if role is admin, then have access the details.pug page
          var userList = [];
          db.query('SELECT * FROM accounts', function(err, rows, fields) {
              if (err) {
                console.log(err);
              } else {
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                  // Create an object to save current row's data
                  var user = {
                    'id': rows[i].id,
                    'username': rows[i].username,
                    'email': rows[i].email,
                    'role': rows[i].role,
                    'status': rows[i].status
                  }
                  userList.push(user); // Add object into array
              }
              res.render('details', {
                isLoggedIn: req.session.isLoggedIn, 
                "userList": userList}); // Render details.pug page using array 
              }
          });
        }
        else { // if role is user, no access to details.pug page
          console.log("User is not an admin, not authorized!");
          res.redirect('/home'); // redirect to home page
        }
      }
    }
  });
});

/* Display the edit user form based on the id that is selected in details.pug page */
app.get('/editUser/:id', (req, res) => {
  var id = req.params.id;
  db.query('SELECT * FROM accounts WHERE id = ?', [id], function(err, rows, fields) {
    if (err) {
      console.log(err);
    } 
    else {
      user = rows;
      //console.log(user);
      res.render('editUser', {isLoggedIn: req.session.isLoggedIn, "userA": user}) 
    }
  });
});

/* Edit account details of a user by ID */
app.post('/editUser/:id', (req, res) => {
  const { id, password, email, status } = req.body;
  const hashedPassword = bcrypt.hashSync(password,bcrypt.genSaltSync(10));
  const sql = "UPDATE accounts SET password = ?, email = ?, status = ? WHERE id = ?";
  db.query(sql, [hashedPassword, email, status, id], function(err, rows, fields) {
    if (err) {
      console.log(err);
    }
    else {
      console.log(rows);
      db.query('SELECT * FROM accounts WHERE id = ?', [id], function(err, rows, fields) {
        if (err) {
          console.log(err);
        } 
        else {
          user = rows;
          console.log(user);
        }
      });
      console.log("Account edited successfully!")
      res.redirect('/details'); // redirect back to details.pug page after edited successfully
      //res.render('editUser', {success: 'Account edited successfully!', "userA": user});
    }
  });
});

/** App listening on port */
app.listen(port, () => {
  console.log(`Task Management System listening at http://localhost:${port}`);
});