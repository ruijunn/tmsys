const db = require('../dbServer'); 
const group = require('../checkGroup');

/** Display create task page */
exports.get_create_task = async function(req, res) {
    if (await group.checkGroup(req.session.username, "project lead")) {
        var applicationArray = [];
        db.query('SELECT app_acronym FROM application', function(err, rows, fields) {
            if (err) {
                console.log(err);
            }
            else {
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                // Create an object to save current row's data
                    var app = {
                        'appname': rows[i].app_acronym
                    }
                    applicationArray.push(app); // Add object into array
                }
            }
            res.render('createTask', {isLoggedIn: req.session.isLoggedIn, "applicationArray": applicationArray});
        });
    }
    else {
        console.log("Not authorized!");
        res.redirect('/home');
    }
}