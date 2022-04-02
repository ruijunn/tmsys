const db = require('../dbServer'); 
const moment = require('moment');
const group = require('../checkGroup');

/** Global variables */
var applicationArray = [];
var planArray = [];

/** Display create task page */
exports.get_create_task = async function(req, res) {
    if (await group.checkGroup(req.session.username, "project lead")) {
        var applicationArray = [];
        var planArray = [];
        db.query('SELECT app_acronym FROM application', function(err, rows, fields) {
            if (err) { console.log(err); }
            else {
                for (var i = 0; i < rows.length; i++) {
                    var app = {
                        'appname': rows[i].app_acronym
                    }
                    applicationArray.push(app); 
                }
                db.query('SELECT plan_MVP_name FROM plan', function(err, rows, fields) {
                    if (err) { console.log(err); }
                    else {
                        for (var x = 0; x < rows.length; x++) {
                            var plan = {
                                'pname': rows[x].plan_MVP_name
                            }
                            planArray.push(plan);
                        }
                    }
                    res.render('createTask', {isLoggedIn: req.session.isLoggedIn, 
                        "applicationArray": applicationArray, "planArray": planArray});
                });
            }
        });
    }
    else {
        console.log("Not authorized!");
        res.redirect('/home');
    }
}

/** Handle form submit for create task */
exports.post_create_task = function(req, res) {
    const {appname, taskname, taskdescription, tasknotes, pname} = req.body;
    const sql = "SELECT * FROM application WHERE app_acronym = ?";
    db.query(sql, [appname], function(error, result) {
        if (error) throw error;
        if (result.length > 0) {
            // task id need to be in the format <app_acronym>_<app_Rnumber>
            const newTaskID = `${result[0].app_acronym}_${result[0].app_Rnumber+1}`;
            console.log(newTaskID);
            const logonUID = req.session.username;
            const currentState = "open";
            const date = new Date().toLocaleString();
            const auditlog = `${tasknotes}: ${logonUID}, ${currentState}, ${date}`;
            console.log(auditlog);
            const taskCreateDate = new Date();
            const sql2 = `INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, 
                task_app_acronym, task_state, task_creator, task_owner, task_createDate) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql2, [newTaskID, taskname, taskdescription, auditlog, pname, appname, currentState, 
                req.session.username, req.session.username, taskCreateDate], function(error, result) {
                if (error) {
                    console.log(error);
                }
                else {
                    const sql3 = "SELECT app_Rnumber FROM application WHERE app_acronym = ?";
                    db.query(sql3, [appname], function(error, result) {
                        if (error) throw error;
                        if (result.length > 0) {
                            const newRnumber = result[0].app_Rnumber + 1;
                            const sql4 = "UPDATE application SET app_Rnumber = ? WHERE app_acronym = ?";
                            db.query(sql4, [newRnumber, appname], function(error, result) {
                                if (error) throw error;
                                console.log("AppRnumber updated!");
                            })
                        }
                    });
                }
                res.render('createTask', {success: 'Task created successfully!', "applicationArray": applicationArray, "planArray": planArray});
                /* console.log("Task created successfully!");
                res.redirect('/home'); */
            });
        }
    });
}

/** Display task list page */
exports.task_list = async function(req, res) {
    // check if username belongs to project lead or team member group
    if (await group.checkGroup(req.session.username, "project lead") || 
    (await group.checkGroup(req.session.username, "team member"))) {
        var taskList = [];
        db.query('SELECT * FROM task', function(err, rows, fields) {
            if (err) {
                console.log(err);
            } else {
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                    var task = {
                        'tid': rows[i].task_id,
                        'name': rows[i].task_name,
  				        'description': rows[i].task_description, 
				        'notes': rows[i].task_notes,
                        'tplan': rows[i].task_plan,
                        'tappname': rows[i].task_app_acronym,
                        'state': rows[i].task_state,
                        'creator': rows[i].task_creator,
                        'owner': rows[i].task_owner,
                        'createDate': moment(rows[i].task_createDate).format("DD/MM/YYYY hh:mm:ss")
                    }
                    taskList.push(task); // Add object into array
                }
                res.render('taskList', {
                    isLoggedIn: req.session.isLoggedIn, "taskList": taskList
                }); // Render taskList.pug page using array 
            }
        });
    }
    else { // if username not belong to project lead or team member group
        console.log("Not authorized!");
        res.redirect('/home'); // redirect to home page
    }
}