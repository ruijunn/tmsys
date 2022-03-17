const express = require('express');
const app = express();
const accountController = require('../controllers/accountController');

app.get('/createUser', accountController.create_user); // Display create user page
app.post('/createUser', accountController.create_user_validation); // Handle create user function
app.get('/changePassword', accountController.changePwd); // Display change password page
app.post('/changePassword', accountController.changePwd_validation); // Handle change password function
app.get('/updateEmail', accountController.update_email); // Display update email page
app.post('/updateEmail', accountController.update_email_validation); // Handle update email function
 
module.exports = app;