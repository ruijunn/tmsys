const mysql = require('mysql'); 
const bcrypt = require('bcrypt');
const group = require('../group');
/* const str = require('../validatePassword'); */

/** Database connection */
const db = mysql.createConnection({
    connectionLimit : 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

/** Create a function for password validation */
function testInput(password) {
    var pattern = new RegExp("^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,10}$");
    return pattern.test(password);
}

/** Display create user page */ 
exports.create_user = async function(req, res) {
    // check if username belong to admin group
    if (await group.checkGroup(req.session.username, "admin")) {
        console.log("User is an admin");
        res.render('createUser', {isLoggedIn: req.session.isLoggedIn}); // redirect to create user page
    }
    // check if username belong to user group
    if (await group.checkGroup(req.session.username, "user")) {
        console.log("User is not an admin, not authorized!");
        res.redirect('/home'); // redirect to home page
    }
}

/** Handle create user function */
exports.create_user_validation = async function(req, res) {
    const {username, password, email, grpName} = req.body;
    const hashedPwd = await bcrypt.hash(password,bcrypt.genSaltSync(10)); // store hash in database
    if (username && password && email && grpName) { // check input fields are not empty
        // check if user with given username exists or not in db
        const sql = "SELECT username FROM accounts WHERE username = ?";
        db.query(sql, [username], function(error, result) {
            if (error) throw error;
            if (result.length === 0) { // if username not exists in db
                if (testInput(password)) { // if password validation returns true, then create new user
                    const sql2 = "INSERT INTO accounts (username, password, email, role, status) VALUES (?, ?, ?, ?, 1)";
                    db.query(sql2, [username, hashedPwd, email, grpName], function (error, result) {
                        if (error) throw error; 
                        res.render('createUser', {success: 'New user created successfully!'});
                    });
                }
                else { // password validation returns false, display error message
                    res.render('createUser', {error: 'Password must contain alphabets, numbers, special characters, and at least 8 to 10 characters'});
                }
            }
            else { // existing user, display error message
                res.render('createUser', {error: 'Username already exists!'});
            }
        });
    }
    else {
        res.render('createUser', {error: 'Please enter all user details!'});
    }
}

/** Display change password page */
exports.changePwd = async function(req, res) {
    res.render('changePassword', {isLoggedIn: req.session.isLoggedIn});
}

/** Handle change password function */
exports.changePwd_validation = async function(req, res) {
  const {currentpwd, newpwd} = req.body;
  const hashedPwd2 = await bcrypt.hash(newpwd,bcrypt.genSaltSync(10)); // store hash in database
  if (currentpwd && newpwd) { // check input fields are not empty
    if (currentpwd === newpwd) { // check if current pwd is the same as new pwd
      res.render('changePassword', {error: 'Current password cannot be the same as new password!'});
    }
    if (testInput(newpwd)) {  // if password validation returns true
      // update user current password with new encrypted password based on user id
      const sql = "UPDATE accounts SET password = ? WHERE id = ?";
      db.query(sql, [hashedPwd2, req.session.userID], function (error, result) {
        if (error) throw error; 
        res.render('changePassword', {success: 'Password updated successfully!'});
      });
    }
    else { // password validation returns false, display error message
        res.render('changePassword', {error: 'Password must contain alphabets, numbers, special characters, and at least 8 to 10 characters'}); 
    }
  }
  else {
    res.render('changePassword', {error: 'Please enter current password and new password!'});
  }
}

/** Display update email page */
exports.update_email = function(req, res) {
    res.render('updateEmail', {isLoggedIn: req.session.isLoggedIn});
}

/** Handle update email function */
exports.update_email_validation = function(req, res) {
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
}