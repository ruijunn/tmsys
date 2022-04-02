const db = require('../dbServer'); 
const moment = require('moment');
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

/** Handle form submit for create plan */
exports.post_create_plan = async function(req, res) {
    const {appname, pname, pstartDate, pendDate} = req.body;
    if (appname && pname && pstartDate && pendDate) { // check if input fields are not empty
	    const sql = "SELECT plan_MVP_name FROM plan WHERE plan_MVP_name = ?";
        db.query(sql, [pname], function(error, result) {
            if (error) throw error;
            if (result.length === 0) { // if plan_MVP_name not exists in db, then create new plan
                const planCreateDate = new Date();
                const sql2 = "INSERT INTO plan (plan_MVP_name, plan_startDate, plan_endDate, plan_app_acronym, plan_createDate) VALUES(?, ?, ?, ?, ?)";
                db.query(sql2, [pname, pstartDate, pendDate, appname, planCreateDate], function(error, result) {
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

/** Display plan list page */
exports.plan_list = async function(req, res) {
    // check if username belongs to project lead group
    if (await group.checkGroup(req.session.username, "project lead")) {
        console.log("User is a project lead");
        var planList = [];
        db.query('SELECT * FROM plan', function(err, rows, fields) {
            if (err) {
                console.log(err);
            } else {
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                    var plan = {
                        'pname': rows[i].plan_MVP_name,
  				        'startdate': moment(rows[i].plan_startDate).format('MM/DD/YYYY'), 
				        'enddate': moment(rows[i].plan_endDate).format('MM/DD/YYYY'),
                        'appname': rows[i].plan_app_acronym,
                        'createDate': moment(rows[i].plan_createDate).format('MM/DD/YYYY'), 
                    }
                    planList.push(plan); // Add object into array
                }
                res.render('planList', {
                    isLoggedIn: req.session.isLoggedIn, "planList": planList
                }); // Render planList.pug page using array 
            }
        });
    }
    else { // if username not belong to project lead group
        console.log("User is not a project lead, not authorized!");
        res.redirect('/home'); // redirect to home page
    }
}