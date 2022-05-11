const express = require('express');
const app = express();
const apiController = require('../controllers/apiController');

app.post('/create', apiController.create_task);
app.get('/getState', apiController.task_by_state);
app.post('/promote', apiController.promote_task);

module.exports = app;