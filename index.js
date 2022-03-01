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
    if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		conn.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (error) throw error; // If there is an issue with the query, output the error
			if (results.length > 0) {   // If the account exists
				// Authenticate the user
				req.session.isLoggedIn = true;
				req.session.username = username;
                res.redirect(req.query.redirect_url ? req.query.redirect_url : '/');
			} else {
				res.send('Incorrect Username and/or Password!');
			}			
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
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

app.get('/createUser', (req, res) => {
    res.render('createUser', {isLoggedIn: req.session.isLoggedIn});
});

app.get('/changePassword', (req, res) => {
    res.render('changePassword', {isLoggedIn: req.session.isLoggedIn});
});

/* app.get('/balance', (req, res) => {
  if (req.session.isLoggedIn === true) {
    res.send('Your account balance is $1234.52');
  } else {
    res.redirect('/login?redirect_url=/balance');
  }
});

app.get('/account', (req, res) => {
  if (req.session.isLoggedIn === true) {
    res.send('Your account number is ACL9D42294');
  } else {
    res.redirect('/login?redirect_url=/account');
  }
}); 

app.get('/contact', (req, res) => {
  res.send('Our address : 321 Main Street, Beverly Hills.');
}); */

/** App listening on port */
app.listen(port, () => {
  console.log(`MyBank app listening at http://localhost:${port}`);
});