const express = require('express');
const app = express();
const planController = require('../controllers/planController');

app.get('/createPlan', planController.get_create_plan); // Display create task form
app.post('/createPlan', planController.post_create_plan); // Handle form submit for create plan

module.exports = app;