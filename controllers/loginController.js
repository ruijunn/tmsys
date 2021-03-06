const db = require('../dbServer'); 
const bcrypt = require('bcrypt');

/** Display login page */
exports.user_login = async function(req, res) {
    if (req.session.isLoggedIn === true) {
        return res.redirect('/home'); // redirect to home page once login successful
    }
    res.render('login', {error: false}); 
}

/** Handle form submit for login */
exports.user_loginAuth = async function(req, res) {
    const {username, password} = req.body;
    if (username && password) { // check input fields are not empty
        var sql = "SELECT * FROM accounts WHERE username = ?";
        db.query(sql, [username], async function (error, results, fields) {
		    if (error) throw error;
		    if (results.length > 0) {   // If the account exists
                // compare entered password with the stored encrypted password
                const validPwd = await bcrypt.compare(password, results[0].password); 
                if (validPwd) {
                    if (results[0].status === 1) { // status = 1 means account is active
                        // Authenticate the user
                        req.session.isLoggedIn = true;
                        req.session.username = username; // store the username in session
                        req.session.userID = results[0].id; // store the id in session
                        console.log("Login Successful!");
                        res.redirect('/home');
                    }
                    else { // status = 0 means account is disabled
                        res.render('login', {error: 'Your account has been disabled!'});
                    }
                }
		    else {
                res.render('login', {error: 'Incorrect Username and/or Password!'});
		    }			
		  }
	  });
	} 
    else {
        res.render('login', {error: 'Please enter Username and Password!'});
	}
}

/** Display logout page */
exports.user_logout = async function(req, res) {
    req.session.isLoggedIn = false;
    console.log("Logout Successful!");
    res.redirect('/login'); // redirect back to login page once logout is successful
}