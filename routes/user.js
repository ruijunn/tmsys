const express = require('express');
const app = express();
const userController = require('../controllers/userController');

app.get('/details', userController.user_list); // Display details page
app.get('/editUser/:id', userController.get_edit_user); // Display edit user form
app.post('/editUser/:id', userController.edit_user); // Handle edit user function

module.exports = app;