const db = require('../dbServer'); 
const group = require('../checkGroup');

/** Display create task page */
exports.get_create_task = async function(req, res) {
    res.render('createTask', {isLoggedIn: req.session.isLoggedIn});
}