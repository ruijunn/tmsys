const express = require('express');
const app = express();
const applicationController = require('../controllers/applicationController');

app.get('/createApplication', applicationController.get_create_application); // Display create application form

module.exports = app;