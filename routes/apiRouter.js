const express = require('express');
const app = express();
const loginController = require('../controllers/loginController');
const applicationController = require('../controllers/applicationController');

app.post('/login', loginController.user_loginAuth);
app.delete('/logout', loginController.user_logout); 
app.get('/applicationList', applicationController.application_list); // Display application list page

module.exports = app;