const express = require('express');
const app = express();
const applicationController = require('../controllers/applicationController');

app.get('/createApplication', applicationController.get_create_application); // Display create application form
app.post('/createApplication', applicationController.post_create_application); // Handle form submit for create application
app.get('/applicationList', applicationController.application_list); // Display application list page
app.get('/editApplication/:appname', applicationController.get_edit_application); // Display edit application form
app.post('/editApplication/:appname', applicationController.post_edit_application); // Handle form submit for edit application

module.exports = app;