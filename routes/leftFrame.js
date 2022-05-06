const express = require('express');
const app = express();
const leftFrameController = require('../controllers/leftFrameController');

app.get('/tmsysLeftFrame', leftFrameController.appList2); // Display login page 


module.exports = app;