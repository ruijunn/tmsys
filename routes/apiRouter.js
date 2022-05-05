const express = require('express');
const app = express();
const apiController = require('../controllers/apiController');

app.post('/task/create', apiController.post_create_task);
app.post('/task', apiController.task_by_state);

module.exports = app;