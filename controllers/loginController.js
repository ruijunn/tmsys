const db = require('../dbServer'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
                        
                        //  JWT + Cookies
                        const jsontoken = 
                            jwt.sign({ userID: results[0].id, username: results[0].username }, process.env.SESSION_SECRET, { expiresIn: '1h'}
                        );
                        res.cookie("token", jsontoken, { httpOnly: true });

                        req.session.isLoggedIn = true;
                        req.session.username = username; // store the username in session
                        req.session.userID = results[0].id; // store the id in session
                        console.log("Login Successful!");

                        res.status(200).json({ 
                            message: `User ${req.session.username} logged in successfully!`,
                            token: jsontoken
                        });
                    }
                    else { // status = 0 means account is disabled
                        //res.render('login', {error: 'Your account has been disabled!'});
                        res.status(400).json( {message: "Your account has been disabled" });
                    }
                }
		    else {
                //res.render('login', {error: 'Incorrect Username and/or Password!'});
                res.status(400).json({message: "Incorrect Username and/or Password!" });
		    }			
		  }
	  });
	} 
    else {
        //res.render('login', {error: 'Please enter Username and Password!'});
        res.status(400).json({ message: "Please enter Username and Password!" });
	}
}

/** Display logout page */
exports.user_logout = async function(req, res) {
    res.clearCookie("token", {path: '/', domain: 'localhost', maxAge: 0});
    req.session.isLoggedIn = false;
    console.log("Logout Successful!")
    res.status(200).json({ message: "Logout Successful!" });
}