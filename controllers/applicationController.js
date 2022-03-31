const db = require('../dbServer'); 
const moment = require('moment');
const group = require('../checkGroup');

/** Global variables */
var user;
var selectArray = []; 

/** Display create application form */
exports.get_create_application = async function(req, res) {
    // check if username belong to project lead group
    if (await group.checkGroup(req.session.username, "project lead")) {
        var selectArray = [];
        const {p_open, p_toDoList, p_doing, p_done} = req.body;
        db.query('SELECT groupName FROM usergrp', [p_open, p_toDoList, p_doing, p_done], function(err, rows, fields) {
            if (err) {
                console.log(err);
            }
            else {
                user = rows;
                //console.log(user);
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                    var s = {
                        'groupname': rows[i].groupName
                    }
                    selectArray.push(s); // Add object into array
                }
            }
            res.render('createApplication', {isLoggedIn: req.session.isLoggedIn, "selectArray": selectArray});
        });
    }
    else { // username not belong to project lead group
        console.log("Not authorized!");
        res.redirect('/home');
    }
}

/** Handle form submit for create application */
exports.post_create_application = function(req, res) {
    const {appname, appdescription, startdate, enddate, p_open, p_toDoList, p_doing, p_done} = req.body;
    if (appname && appdescription && startdate && enddate && p_open && p_toDoList && p_doing && p_done) {
        const sql = "SELECT app_acronym FROM application WHERE app_acronym = ?";
        db.query(sql, [appname], function(error, result) {
            if (error) throw error;
            if (result.length === 0) { // if appname not exists in db, then create new application
                const sql2 = "INSERT INTO application (app_acronym, app_description, app_Rnumber, app_startDate, app_endDate, app_permit_open, app_permit_toDoList, app_permit_doing, app_permit_done) VALUES(?, ?, 0, ?, ?, ?, ?, ?, ?)";
                db.query(sql2, [appname, appdescription, startdate, enddate, p_open, p_toDoList, p_doing, p_done], function(error, result) {
                    if (error) throw error;
                    res.render('createApplication', {success: 'Application created successfully!', "selectArray": selectArray});
                });
            }
            else { // existing application name, display error message
                res.render('createApplication', {error: 'Application name already exists!', "selectArray": selectArray});
            }
        });
    }
    else {
        res.render('createApplication', {error: 'Please enter application details!'});
    }
}

/** Display application list page */
exports.application_list = async function(req, res) {
    // check if username belongs to project lead group
    if (await group.checkGroup(req.session.username, "project lead")) {
        console.log("User is a project lead");
        var appList = [];
        db.query('SELECT * FROM application', function(err, rows, fields) {
            if (err) {
                console.log(err);
            } else {
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                    var app = {
                        'appname': rows[i].app_acronym,
				        'description': rows[i].app_description,	
  				        'startdate': moment(rows[i].app_startDate).format('MM/DD/YYYY'), 
				        'enddate': moment(rows[i].app_endDate).format('MM/DD/YYYY')
                    }
                    appList.push(app); // Add object into array
                }
                res.render('applicationList', {
                    isLoggedIn: req.session.isLoggedIn, 
                    "appList": appList
                }); // Render applicationList.pug page using array 
            }
        });
    }
    else { // if username not belong to project lead group
        console.log("User is not a project lead, not authorized!");
        res.redirect('/home'); // redirect to home page
    }
}

/** Display edit application page */
exports.get_edit_application = async function(req, res) {
    var appname = req.params.appname;
    db.query('SELECT * FROM application WHERE app_acronym = ?', [appname], function(err, rows, fields) {
        if (err) {
            console.log(err);
        } 
        else {
            res.render('editApplication', {isLoggedIn: req.session.isLoggedIn, "app": appname});
        }
    });
}

/** Handle form submit for edit application */
exports.post_edit_application = async function(req, res) {
    var appname = req.params.appname;
    const {appdescription} = req.body;
    if (appdescription) { // check if app description is not empty
	    const sql = "UPDATE application SET app_description = ? WHERE app_acronym = ?"; 
        db.query(sql, [appdescription, appname], function (error, result) {
            if (error) throw error; 
            res.render('editApplication', {success: 'Successfully edited application details!', "app": appname});
        });
    }
    else {
        res.render('editApplication', {error: 'Please enter application description!', "app": appname});
    }
}
