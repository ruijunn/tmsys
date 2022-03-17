const express = require('express');
const app = express();
const accountController = require('../controllers/accountController');

app.get('/createUser', accountController.create_user); // Display create user page
app.post('/createUser', accountController.create_user_validation); // Handle create user function
app.get('/changePassword', accountController.changePwd);
app.post('/changePassword', accountController.changePwd_validation);
app.get('/updateEmail', accountController.update_email);
app.post('/updateEmail', accountController.update_email_validation);
 
module.exports = app;