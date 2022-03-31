const db = require('../dbServer'); 
const group = require('../checkGroup');

/** Global variables */
var applicationArray = [];

/** Display create task page */
exports.get_create_plan = async function(req, res) {
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
            res.render('createPlan', {isLoggedIn: req.session.isLoggedIn, "applicationArray": applicationArray});
        });
    }
    else {
        console.log("Not authorized!");
        res.redirect('/home');
    }
}

exports.post_create_plan = async function(req, res) {
    const {appname, pname, pstartDate, pendDate} = req.body;
    if (appname && pname && pstartDate && pendDate) { // check if app description is not empty
	    const sql = "SELECT plan_MVP_name FROM plan WHERE plan_MVP_name = ?";
        db.query(sql, [pname], function(error, result) {
            if (error) throw error;
            if (result.length === 0) { // if appname not exists in db, then create new application
                const sql2 = "INSERT INTO plan (plan_MVP_name, plan_startDate, plan_endDate, plan_app_acronym) VALUES(?, ?, ?, ?)";
                db.query(sql2, [pname, pstartDate, pendDate, appname], function(error, result) {
                    if (error) throw error;
                    res.render('createPlan', {success: 'Plan created successfully!', "applicationArray": applicationArray});
                });
            }
            else { // existing plan name, display error message
                res.render('createPlan', {error: 'Plan MVP Name already exists!', "applicationArray": applicationArray});
            }
        });
    }
    else {
        res.render('createPlan', {error: 'Please enter plan details!', "applicationArray": applicationArray});
    }
}