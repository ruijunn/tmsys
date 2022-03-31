const express = require('express');
const app = express();
const taskController = require('../controllers/taskController');

app.get('/createTask', taskController.get_create_task); // Display create task form
app.post('/createTask', taskController.post_create_task); // Handle form submit for create task

module.exports = app;