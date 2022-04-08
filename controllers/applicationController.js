const db = require('../dbServer'); 
const moment = require('moment');
const group = require('../checkGroup');
const alert = require('alert');

/** Global variables */
var selectArray = [];
var appList = [];

/** Display create application form */
exports.get_create_application = async function(req, res) {
    // check if username belong to project lead group
    if (await group.checkGroup(req.session.username, "project lead")) {
        const {p_create, p_open, p_toDoList, p_doing, p_done} = req.body;
        db.query('SELECT groupName FROM usergrp', [p_create, p_open, p_toDoList, p_doing, p_done], function(err, rows, fields) {
            if (err) {
                console.log(err);
            }
            else {
                grp = rows;
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
        alert("You are not authorized to view this page!");
    }
}

/** Handle form submit for create application */
exports.post_create_application = function(req, res) {
    const {appname, appdescription, startdate, enddate, p_create, p_open, p_toDoList, p_doing, p_done} = req.body;
    if (appname && appdescription && startdate && enddate && p_create && p_open && p_toDoList && p_doing && p_done) {
        const sql = "SELECT app_acronym FROM application WHERE app_acronym = ?";
        db.query(sql, [appname], function(error, result) {
            if (error) throw error;
            if (result.length === 0) { // if appname not exists in db, then create new application
                const appCreateDate = new Date();
                const sql2 = `INSERT INTO application (app_acronym, app_description, 
                    app_Rnumber, app_startDate, app_endDate, app_permit_create, 
                    app_permit_open, app_permit_toDoList, app_permit_doing, app_permit_done, app_createDate) 
                    VALUES(?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.query(sql2, [appname, appdescription, startdate, enddate, p_create, p_open, p_toDoList, p_doing, p_done, appCreateDate], function(error, result) {
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
        res.render('createApplication', {error: 'Please enter application details!', "selectArray": selectArray});
    }
}

/** Display application list page */
exports.application_list = async function(req, res) {
    // check if username belongs to project lead group
    if (await group.checkGroup(req.session.username, "project lead")) {
        db.query('SELECT * FROM application', function(err, rows, fields) {
            if (err) {
                console.log(err);
            } else {
                var tempArray = [];
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                    var app = {
                        'appname': rows[i].app_acronym,
				        'description': rows[i].app_description,	
                        'rnumber': rows[i].app_Rnumber,
  				        'startdate': moment(rows[i].app_startDate).format('MM/DD/YYYY'), 
				        'enddate': moment(rows[i].app_endDate).format('MM/DD/YYYY'),
                        'pcreate': rows[i].app_permit_create,
                        'popen': rows[i].app_permit_open,
                        'ptoDoList': rows[i].app_permit_toDoList,
                        'pdoing': rows[i].app_permit_doing,
                        'pdone': rows[i].app_permit_done,
                        'createdate': moment(rows[i].app_createDate).format('MM/DD/YYYY')
                    }
                    tempArray.push(app); // Add object into array
                }
                appList = tempArray;
                res.render('applicationList', {
                    isLoggedIn: req.session.isLoggedIn, "appList": appList
                }); // Render applicationList.pug page using array 
            }
        });
    }
    else { // if username not belong to project lead group
        alert("You are not authorized to view this page!");
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
            app = rows;
            appList = [];
            for (var i = 0; i < rows.length; i++) {
                var app = {
                    'appname': rows[i].app_acronym,
                    'description': rows[i].app_description,	
                    'rnumber': rows[i].app_Rnumber,
                    'startdate': moment(rows[i].app_startDate).format('MM/DD/YYYY'), 
                    'enddate': moment(rows[i].app_endDate).format('MM/DD/YYYY'),
                    'pcreate': rows[i].app_permit_create,
                    'popen': rows[i].app_permit_open,
                    'ptoDoList': rows[i].app_permit_toDoList,
                    'pdoing': rows[i].app_permit_doing,
                    'pdone': rows[i].app_permit_done
                }
                appList.push(app); // Add object into array
            }
            res.render('editApplication', {
                isLoggedIn: req.session.isLoggedIn, "app": appname, "appList": appList
            }); // Render editApplication.pug page using array 
        }
    });
}

/** Handle form submit for edit application */
exports.post_edit_application = async function(req, res) {
    var appname = req.params.appname;
    const {appdescription, p_create, p_open, p_toDoList, p_doing, p_done} = req.body;
    if (appdescription && p_create && p_open && p_toDoList && p_doing && p_done) {
	    const sql = 
            `UPDATE application SET app_description = ?, app_permit_create = ?, app_permit_open = ?, 
            app_permit_toDoList = ?, app_permit_doing = ?, app_permit_done = ? WHERE app_acronym = ?`; 
        db.query(sql, [appdescription, p_create, p_open, p_toDoList, p_doing, p_done, appname], function (err, result) {
            if (err) {
                console.log(err);
            }
            else {
                db.query('SELECT * FROM application WHERE app_acronym = ?', [appname], function(err, rows, fields) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        app = rows;
                    }
                });
            }
            res.render('editApplication', {
                success: 'Successfully edited application details!', "app": appname, "appList": appList
            }); // Render editApplication.pug page using array 
        });
    }
    else {
        res.render('editApplication', {
            error: 'Please enter application details!', "app": appname, "appList": appList
        }); // Render editApplication.pug page using array 
    }
}
