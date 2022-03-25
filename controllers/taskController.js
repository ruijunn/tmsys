const db = require('../dbServer'); 
const group = require('../checkGroup');

/** Display create task page */
exports.get_create_task = async function(req, res) {
    if (await group.checkGroup(req.session.username, "project lead")) {
        res.render('createTask', {isLoggedIn: req.session.isLoggedIn});
    }
    else {
        console.log("Not authorized!");
        res.redirect('/home');
    }
}