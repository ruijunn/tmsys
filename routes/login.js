const express = require('express');
const app = express();
const loginController = require('../controllers/loginController');

app.get('/login', loginController.user_login); // Display login page 
app.post('/login', loginController.user_loginAuth); // Handle form submit for login 
app.get('/logout', loginController.user_logout); // Handle logout function

module.exports = app;