const express = require('express');
const app = express();
const planController = require('../controllers/planController');

app.get('/createPlan', planController.get_create_plan); // Display create task form

module.exports = app;