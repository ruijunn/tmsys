const db = require('../dbServer'); 
const moment = require('moment');
const group = require('../checkGroup');
const alert = require('alert');
const transporter = require('../email');

/** Global variables */
var applicationArray = [];
var planArray = [];
var taskList = [];
var inputs = [];

/** Display create task page */
exports.get_create_task = async function(req, res) {
    db.query("SELECT * FROM application", async function(err, rows, fields) {
        if (await group.checkGroup(req.session.username, rows[0].app_permit_createTask)) {
            applicationArray = [];
            for (var i = 0; i < rows.length; i++) {
                var app = {
                    'appname': rows[i].app_acronym
                }
                applicationArray.push(app); 
            }
            db.query('SELECT plan_MVP_name FROM plan', function(err, rows, fields) {
                if (err) { 
                    console.log(err); 
                }
                else {
                    var pArray = [];
                    for (var x = 0; x < rows.length; x++) {
                        var plan = {
                            'pname': rows[x].plan_MVP_name
                        }
                        pArray.push(plan);
                    }
                    planArray = pArray;
                }
                res.render('createTask', {
                    isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username,
                    "applicationArray": applicationArray, "planArray": planArray
                }); // Render createTask.pug page using array 
            });
        }
        else {
            alert("You are not authorized to view this page!");
            res.redirect('/home');
        }
    });
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
            // format the task notes with username, current state, date & timestamp
            const logonUID = req.session.username;
            const currentState = "open";
            const date = new Date().toLocaleString();
            const auditlog = `${tasknotes}, ${logonUID}, ${currentState}, ${date}`;
            console.log(auditlog);
            const taskCreateDate = new Date();
            const sql2 = `INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, 
                task_app_acronym, task_state, task_creator, task_owner, task_createDate) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql2, [newTaskID, taskname, taskdescription, auditlog, pname, appname, currentState, 
                req.session.username, req.session.username, taskCreateDate], function(error, row, fields) {
                if (error) {
                    console.log(error);
                }
                else {
                    const newRnumber = result[0].app_Rnumber + 1;
                    const sql4 = "UPDATE application SET app_Rnumber = ? WHERE app_acronym = ?";
                    db.query(sql4, [newRnumber, appname], function(error, result) {
                        if (error) throw error;
                        console.log("AppRnumber updated!");
                    })
                }
                res.render('createTask', {
                    success: 'Task created successfully!', userLoggedIn: req.session.username,
                     "applicationArray": applicationArray, "planArray": planArray
                }); // Render createTask.pug page using array 
            });
        }
    });
}

/** Display task list page */
exports.task_list = async function(req, res) {
    // check if username belongs to project lead, project manager or team member group
    if (await group.checkGroup(req.session.username, "project lead") || 
    (await group.checkGroup(req.session.username, "project manager") ||
    (await group.checkGroup(req.session.username, "team member")))) {
        db.query('SELECT * FROM task', function(err, rows, fields) {
            if (err) {
                console.log(err);
            } else {
                var tempArray = [];
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
                    tempArray.push(task); // Add object into array
                }
                taskList = tempArray;

                res.render('taskList', {
                    isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username, "taskList": taskList
                }); // Render taskList.pug page using array 
            }
        });
    }
    else { // if username not belong to project lead, project manager or team member group
        alert("You are not authorized to view this page!");
        res.redirect('/home');
    }
}

/** Display edit task page */
exports.get_edit_task = async function(req, res) {
    db.query('SELECT * FROM application', async function(error, result, fields) {
        if (error) throw error;
        var tid = req.params.tid;
        db.query('SELECT * FROM task WHERE task_id = ?', [tid], async function(err, rows, fields) {
            if (err) {
                console.log(err);
            } 
            else {
                task = rows;
                taskList = [];
                for (var i = 0; i < rows.length; i++) {
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

                    /** Check the task current state and the app permit */
                    if (rows[i].task_state == 'open' && await group.checkGroup(req.session.username, result[0].app_permit_open)) {
                        inputs = [{
                            label: `Task State:`,
                            name: "t_state",
                            type: "select",
                            class: "form-select",
                            options: ["todolist"]
                        }]
                    }
                    else if (rows[i].task_state === 'todolist' && await group.checkGroup(req.session.username, result[0].app_permit_toDoList)) {
                        inputs = [{
                            label: `Task State:`,
                            name: "t_state",
                            type: "select",
                            class: "form-select",
                            options: ["doing"]
                        }]
                    }
                    else if (rows[i].task_state === 'doing' && await group.checkGroup(req.session.username, result[0].app_permit_doing)) {
                        inputs = [{
                            label: `Task State:`,
                            name: "t_state",
                            type: "select",
                            class: "form-select",
                            options: ["todolist", "done"]
                        }]
                    }
                    else if (rows[i].task_state === 'done' && await group.checkGroup(req.session.username, result[0].app_permit_done)) {
                        inputs = [{
                            label: `Task State:`,
                            name: "t_state",
                            type: "select",
                            class: "form-select",
                            options: ["doing", "close"]
                        }]
                    }
                }
                res.render('editTask', {
                    isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username,
                    "task": tid, "taskList": taskList, "inputs": inputs
                }); // Render editTask.pug page using array  
            }
        });
    });
}

/** Handle form submit for edit task */
exports.post_edit_task = async function(req, res) {
    var tid = req.params.tid;
    const {tdescription, notes, t_state} = req.body;
    if (tdescription && notes && t_state) { // check for empty fields
        task_notes = req.body.tnotes;
        //console.log("current task notes >>>", task_notes);
        var date = new Date().toLocaleString();
        var new_note = `${notes}, ${req.session.username}, ${t_state}, ${date}`;
        //console.log("added new task notes >>>", new_note);
        task_notes += `\n${new_note}`;
        //console.log("finalised task notes >>>", task_notes);

        const sql = "UPDATE task SET task_description = ?, task_notes = ?, task_state = ?, task_owner = ? WHERE task_id = ?";
        db.query(sql, [tdescription, task_notes, t_state, req.session.username, tid], function(err, result) {
            if (err) {
                console.log(err);
            }
            else {
                db.query("SELECT * FROM task WHERE task_id = ?", [tid], function(err, rows, fields) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        task = rows;
                    }
                });
            }
            res.render('editTask', { 
                success: 'Task details successfully updated!', "task": tid, "taskList": taskList, "inputs": inputs
            }); // Render editTask.pug page using array 
        });

        /** 
         * team member have to send email notification to lead when the task has been promoted to done state
         * if task state is done, then it will send the email
         */
        if (t_state === 'done') {
            /** get team member data */
            var emailSQL = "SELECT email FROM accounts WHERE username = ?";
            var sendList = [];
            db.query(emailSQL, [req.session.username], async function(err, rows, fields) {
                for (x in rows) {
                    if (await group.checkGroup(req.session.username, "team member")) {
                        sendList.push(rows[x].email)
                    }
                }
                console.log(sendList); 
            }); 

            /**
             * get project lead data
             * sql = select email from accounts where username in (select username from usergrp_list where groupname = "project lead");
             * output : "dev1@gmail.com"
             */
            
            const sql = 'SELECT email FROM accounts where username IN (SELECT username FROM usergrp_list WHERE groupname = "project lead")';
            var toList = [];
            db.query(sql, function(err, result, fields) {
                for (k in result) {
                    toList.push(result[k].email);
                }
                console.log(toList);
            });

            var message = {
                from: sendList,
                to: toList,
                subject: "Seeking task to be approved",
                text: "Task has been promoted to done state, waiting for task to be approved"
            }

            transporter.sendMail(message, function(err, info) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(info);
                }
            });
        }
    }  
    else { // display error message if fields are empty
        res.render('editTask', { 
            error: 'Please enter the task details!', "task": tid, "taskList": taskList, "inputs": inputs
        });
    }
}