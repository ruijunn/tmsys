const mysql = require('mysql'); 
const bcrypt = require('bcrypt');

/** Database connection */
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

/** Create a function to check if user is in a group */
function checkGroup (userid, groupname) {
    // create promise with resolve and reject as params
    return new Promise((resolve, reject) => {
        const sql = "SELECT groupName FROM usergrp WHERE id = ?";
        db.query(sql, [userid], (error, result) => {
        if (error) throw error;
        if (result.length > 0) {
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

/** Display create user page */ 
exports.create_user = function(req, res) {
    const sql = "SELECT role FROM accounts WHERE id = ?";
    db.query(sql, [req.session.userID], async function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
            var checkUsrGrp = await checkGroup(req.session.userID, results[0].role);
            // console.log(checkUsrGrp);
            if (checkUsrGrp) {
                if (results[0].role === "admin") { // check if role is admin
                    console.log("User is an admin");
                    res.render('createUser', {isLoggedIn: req.session.isLoggedIn}); // redirect to create user page
                }
                else { // check if role is user
                    console.log("User is not an admin, not authorized!");
                    res.redirect('/home'); // redirect to home page
                }
            } 
        }
    });
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