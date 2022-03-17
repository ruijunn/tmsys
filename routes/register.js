const express = require('express');
const app = express();
const registerController = require('../controllers/registerController');

app.get('/createUser', registerController.create_user); // Display create user page
app.post('/createUser', registerController.create_user_validation); // Handle create user function

module.exports = app;