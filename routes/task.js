const express = require('express');
const app = express();
const taskController = require('../controllers/taskController');

app.get('/createTask', taskController.get_create_task); // Display create task form
app.post('/createTask', taskController.post_create_task); // Handle form submit for create task
app.get('/taskList', taskController.task_list); // Display task list page
app.get('/editTask/:tid', taskController.get_edit_task); // Display edit task form
app.post('/editTask/:tid', taskController.post_edit_task); // Handle form submit for edit task

module.exports = app;