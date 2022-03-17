const express = require('express');
const app = express();
const accountController = require('../controllers/accountController');

app.get('/createUser', accountController.create_user); // Display create user page
app.post('/createUser', accountController.create_user_validation); // Handle create user function

module.exports = app;