const express = require('express');
const app = express();

/** Display home page */
app.get('/home', (req, res) => {
    res.render('index', {isLoggedIn: req.session.isLoggedIn});
}); 

module.exports = app;