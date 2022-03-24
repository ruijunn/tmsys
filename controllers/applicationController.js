const db = require('../dbServer'); 
const group = require('../checkGroup');

exports.get_create_application = async function(req, res) {
    if (await group.checkGroup(req.session.username, "project lead") === "project lead") {
        res.render('createApplication', {isLoggedIn: req.session.isLoggedIn});
    }
}