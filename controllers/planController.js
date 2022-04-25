const db = require('../dbServer'); 
const moment = require('moment');
const group = require('../checkGroup');
const alert = require('alert');

/** Global variables */
var applicationArray = [];
var planList = [];

/** Display create plan page */
exports.get_create_plan = async function(req, res) {
    db.query("SELECT * FROM application", async function(err, rows, fields) {
        if (await group.checkGroup(req.session.username, rows[0].app_permit_createPlan)) {
            db.query('SELECT app_acronym FROM application', async function(err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                else {
                    var tempArray = [];
                    // Loop check on each row
                    for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                        var app = {
                            'appname': rows[i].app_acronym
                        }
                        tempArray.push(app); // Add object into array
                    }
                }
                applicationArray = tempArray;
                res.render('createPlan', {isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username,
                    "applicationArray": applicationArray}); // Render createPlan.pug page using array 
            });
        }
        else {
            alert("You are not authorized to view this page!");
            res.redirect('/home');
        }
    });
}

/** Handle form submit for create plan */
exports.post_create_plan = async function(req, res) {
    const {appname, pname, pstartDate, pendDate} = req.body;
    if (appname && pname && pstartDate && pendDate) { // check if input fields are not empty
	    const sql = "SELECT plan_MVP_name FROM plan WHERE plan_MVP_name = ?";
        db.query(sql, [pname], async function(error, result) {
            if (error) throw error;
            if (result.length === 0) { // if plan_MVP_name not exists in db, then create new plan
                const planCreateDate = new Date();
                const sql2 = "INSERT INTO plan (plan_MVP_name, plan_startDate, plan_endDate, plan_app_acronym, plan_createDate) VALUES(?, ?, ?, ?, ?)";
                db.query(sql2, [pname, pstartDate, pendDate, appname, planCreateDate], function(error, result) {
                    if (error) throw error;
                    res.render('createPlan', {success: 'Plan created successfully!', "applicationArray": applicationArray}); // Render createPlan.pug page using array 
                });
            }
            else { // existing plan name, display error message
                res.render('createPlan', {error: 'Plan MVP Name already exists!', "applicationArray": applicationArray}); // Render createPlan.pug page using array 
            }
        });
    }
    else {
        res.render('createPlan', {error: 'Please enter plan details!', "applicationArray": applicationArray}); // Render createPlan.pug page using array 
    }
}

/** Display plan list page */
exports.plan_list = async function(req, res) {
    db.query('SELECT * FROM plan', async function(err, rows, fields) {
        if (err) {
            console.log(err);
        } else {
            var tempArray = [];
            // Loop check on each row
            for (var i = 0; i < rows.length; i++) {
                // Create an object to save current row's data
                var plan = {
                    'pname': rows[i].plan_MVP_name,
                      'startdate': moment(rows[i].plan_startDate).format('DD/MM/YYYY'), 
                    'enddate': moment(rows[i].plan_endDate).format('DD/MM/YYYY'),
                    'appname': rows[i].plan_app_acronym,
                    'createDate': moment(rows[i].plan_createDate).format('DD/MM/YYYY'), 
                }
                tempArray.push(plan); // Add object into array
            }
            planList = tempArray;
            res.render('planList', {
                isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username, "planList": planList
            }); // Render planList.pug page using array 
        }
    });
}

/** Display edit plan page */
exports.get_edit_plan = async function(req, res) {
    if (await group.checkGroup(req.session.username, "project manager")) {
        var pname = req.params.pname;
        db.query('SELECT * FROM plan WHERE plan_MVP_name = ?', [pname], function(err, rows, fields) {
            if (err) {
                console.log(err);
            }
            else {
                plan = rows;
                planList = [];
                for (var i = 0; i < rows.length; i++) {
                    var plan = {
                        'pname': rows[i].plan_MVP_name,
                        'pstartDate': rows[i].plan_startDate,
                        'pendDate': rows[i].plan_endDate,
                        'appname': rows[i].plan_app_acronym
                    }
                    planList.push(plan);
                }
                res.render('editPlan', {
                    isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username, "plan": pname, "planList": planList
                }); // Render editPlan.pug page using array 
            }
        });
    }
    else {
        alert("You are not authorized to view this page!");
        res.redirect('/home');
    }
}

/** Handle form submit for edit plan */
exports.post_edit_plan = async function(req, res) {
    var pname = req.params.pname;
    const { pstartDate, pendDate } = req.body;
    if (pstartDate && pendDate) {
        const sql = "UPDATE plan SET plan_startDate = ?, plan_endDate = ? WHERE plan_MVP_name = ?";
        db.query(sql, [pstartDate, pendDate, pname], async function(err, result) {
            if (err) {
                console.log(err);
            }
            else {
                db.query('SELECT * FROM plan WHERE plan_MVP_name = ?', [pname], async function(err, rows, fields) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        plan = rows;
                    }
                });
            }
            res.render('editPlan', {
                success: 'Successfully edited plan details!', "plan": pname, "planList": planList
            }); // Render editPlan.pug page using array 
        })
    }
    else {
        res.render('editPlan', {
            error: 'Please enter plan start or end date!', "plan": pname, "planList": planList
        }); // Render editPlan.pug page using array 
    }
}