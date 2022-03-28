const express = require('express');
const app = express();
const groupController = require('../controllers/groupController');

app.get('/createGroup', groupController.user_group); // Display create group form
app.post('/createGroup', groupController.user_group_create); // Handle create group form
app.get('/listUsers', groupController.user_list); // Display user list 
app.get('/assignGroup/:username', groupController.get_user_group); // Display assign group form
app.post('/assignGroup/:username', groupController.post_user_group); // Handle assign group form
app.get('/removeGroup/:username', groupController.get_delete_user_group); // Display remove group form
app.post('/removeGroup/:username', groupController.delete_user_group); // Handle remove group form

module.exports = app;