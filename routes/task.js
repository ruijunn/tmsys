const express = require('express');
const app = express();
const taskController = require('../controllers/taskController');

app.get('/createTask', taskController.get_create_task); // Display create task form

module.exports = app;