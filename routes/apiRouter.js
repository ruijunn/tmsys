const express = require('express');
const app = express();
const loginController = require('../controllers/loginController');
const applicationController = require('../controllers/applicationController');
const taskController = require('../controllers/taskController');

app.post('/login', loginController.user_loginAuth);
app.delete('/logout', loginController.user_logout); 
app.get('/applicationList', applicationController.application_list);
app.get('/task/create', taskController.get_create_task);
app.post('/task/create', taskController.post_create_task);

app.post('/task', taskController.task_list2);
//app.post('/task/:state', taskController.task_list2);

module.exports = app;