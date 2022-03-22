const express = require('express');
const app = express();
const groupController = require('../controllers/groupController');

app.get('/createGroup', groupController.user_group); // Display create group form
app.post('/createGroup', groupController.user_group_create); // Handle create group form

module.exports = app;