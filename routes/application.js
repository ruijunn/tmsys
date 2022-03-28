const express = require('express');
const app = express();
const applicationController = require('../controllers/applicationController');

app.get('/createApplication', applicationController.get_create_application); // Display create application form
app.post('/createApplication', applicationController.post_create_application); // Handle form submit for create application
app.get('/applicationList', applicationController.application_list); // Display application list page

module.exports = app;