const db = require('../dbServer'); 
const moment = require('moment');
const group = require('../checkGroup');
const alert = require('alert');

/** Global variables */
var selectArray = [];
var appList = [];
var permitArray = [];

/** Display create application form */
exports.get_create_application = async function(req, res) {
    // check if username belong to project lead group
    if (await group.checkGroup(req.session.username, "project lead")) {
        const {p_open, p_toDoList, p_doing, p_done, p_createTask, p_createPlan} = req.body;
        db.query('SELECT groupName FROM usergrp', [p_open, p_toDoList, p_doing, p_done, p_createTask, p_createPlan], function(err, rows, fields) {
            if (err) {
                console.log(err);
            }
            else {
                grp = rows;
                var sArray = [];
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                    var s = {
                        'groupname': rows[i].groupName
                    }
                    sArray.push(s); // Add object into array
                }
                selectArray = sArray;
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
    const {appname, appdescription, startdate, enddate, p_open, p_toDoList, p_doing, p_done, p_createTask, p_createPlan} = req.body;
    const sql = "SELECT app_acronym FROM application WHERE app_acronym = ?";
    db.query(sql, [appname], function(error, result) {
        if (error) throw error;
        if (result.length === 0) { // if appname not exists in db, then create new application
            const appCreateDate = new Date();
            const sql2 = `INSERT INTO application (app_acronym, app_description, app_Rnumber, app_startDate, app_endDate, app_permit_open, 
                app_permit_toDoList, app_permit_doing, app_permit_done, app_permit_createTask, app_permit_createPlan, app_createDate) 
                VALUES(?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql2, [appname, appdescription, startdate, enddate, p_open, p_toDoList, p_doing, p_done, p_createTask, p_createPlan, appCreateDate], function(error, result) {
                if (error) throw error;
                res.render('createApplication', {success: 'Application created successfully!', "selectArray": selectArray});
            });
        }
        else { // existing application name, display error message
            res.render('createApplication', {error: 'Application name already exists!', "selectArray": selectArray});
        }
    });
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
  				        'startdate': moment(rows[i].app_startDate).format('DD/MM/YYYY'), 
				        'enddate': moment(rows[i].app_endDate).format('DD/MM/YYYY'),
                        'popen': rows[i].app_permit_open,
                        'ptoDoList': rows[i].app_permit_toDoList,
                        'pdoing': rows[i].app_permit_doing,
                        'pdone': rows[i].app_permit_done,
                        'pcreateTask': rows[i].app_permit_createTask,
                        'pcreatePlan': rows[i].app_permit_createPlan,
                        'createdate': moment(rows[i].app_createDate).format('DD/MM/YYYY')
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
                    'startdate': moment(rows[i].app_startDate).format('DD/MM/YYYY'), 
                    'enddate': moment(rows[i].app_endDate).format('DD/MM/YYYY'),
                    'popen': rows[i].app_permit_open,
                    'ptoDoList': rows[i].app_permit_toDoList,
                    'pdoing': rows[i].app_permit_doing,
                    'pdone': rows[i].app_permit_done,
                    'pcreateTask': rows[i].app_permit_createTask,
                    'pcreatePlan': rows[i].app_permit_createPlan,
                }
                appList.push(app); // Add object into array
            }
            const {p_create, p_open, p_toDoList, p_doing, p_done, p_createTask, p_createPlan} = req.body;
            var gArray = [];
            db.query('SELECT groupName FROM usergrp', [p_create, p_open, p_toDoList, p_doing, p_done, p_createTask, p_createPlan], function(err, result, fields) {
                for (var i = 0; i < result.length; i++) {
                    var g = {
                        'groupname': result[i].groupName
                    }
                    gArray.push(g);
                }
                permitArray = gArray;
                res.render('editApplication', {
                    isLoggedIn: req.session.isLoggedIn, "app": appname, "appList": appList, "permitArray": permitArray
                }); // Render editApplication.pug page using array 
            });
            
        }
    });
}

/** Handle form submit for edit application */
exports.post_edit_application = async function(req, res) {
    var appname = req.params.appname;
    const {appdescription, startdate, enddate, p_open, p_toDoList, p_doing, p_done, p_createTask, p_createPlan} = req.body;
    if (appdescription && startdate && enddate && p_open && p_toDoList && p_doing && p_done && p_createTask, p_createPlan) {
	    const sql = 
            `UPDATE application SET app_description = ?, app_startDate = ?, app_endDate = ?, app_permit_open = ?, 
            app_permit_toDoList = ?, app_permit_doing = ?, app_permit_done = ?,
            app_permit_createTask = ?, app_permit_createPlan = ?  WHERE app_acronym = ?`; 
        db.query(sql, [appdescription, startdate, enddate, p_open, p_toDoList, p_doing, p_done, p_createTask, p_createPlan, appname], function (err, result) {
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
                success: 'Successfully edited application details!', "app": appname, "appList": appList, "permitArray": permitArray
            }); // Render editApplication.pug page using array 
        });
    }
    else {
        res.render('editApplication', {
            error: 'Please enter application details!', "app": appname, "appList": appList, "permitArray": permitArray
        });
    }
}
