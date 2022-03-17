const mysql = require('mysql');
const bcrypt = require('bcrypt');

/** Database connection */
const db = mysql.createConnection({
    connectionLimit : 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

/** Display login page */
exports.user_login = async function(req, res) {
    if (req.session.isLoggedIn === true) {
        return res.redirect('/home'); // redirect to home page once login successful
    }
    res.render('login', {error: false}); 
}

/** Handle form submit for login */
exports.user_loginAuth = function(req, res) {
    const {username, password} = req.body;
    if (username && password) { // check input fields are not empty
        var sql = "SELECT * FROM accounts WHERE username = ?";
        db.query(sql, [username], async function (error, results, fields) {
		    if (error) throw error;
		    if (results.length > 0) {   // If the account exists
                // compare entered password with the stored encrypted password
                const validPwd = await bcrypt.compare(password, results[0].password); 
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
                        res.redirect('/home') // redirect to home page
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
    console.log("Logout Successful!")
    res.redirect('/'); // redirect back to login page
}