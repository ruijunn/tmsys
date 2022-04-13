const express = require('express');
const app = express();
const planController = require('../controllers/planController');

app.get('/createPlan', planController.get_create_plan); // Display create task form
app.post('/createPlan', planController.post_create_plan); // Handle form submit for create plan
app.get('/planList', planController.plan_list); // Display plan list page
app.get('/editPlan/:pname', planController.get_edit_plan); // Display edit plan form
app.post('/editPlan/:pname', planController.post_edit_plan); // Handle form submit for edit plan

module.exports = app;