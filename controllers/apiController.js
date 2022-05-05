const db = require('../dbServer'); 
const group = require('../checkGroup');
const transporter = require('../email');
const bcrypt = require('bcrypt');

/** Retrieve tasks in a particular state */
exports.task_by_state = async function(req, res) {
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }
    // verify auth credentials
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    db.query("SELECT * FROM accounts WHERE username = ?", [username], async (error, results, fields) => {
        if (error) throw error;
        if (results.length > 0) {
            const validPwd = await bcrypt.compare(password, results[0].password); 
            if (username && validPwd) {
                db.query('SELECT groupname FROM usergrp_list WHERE username = ?', [username], function(err, result2, fields) {
                    if (results[0].status === 1) { 
                        const state = req.body.state;
                        db.query("SELECT * FROM task WHERE task_state = ?", [state], function(err, rows, fields) {
                            if (err) {
                                res.status(500).json({ message: "Internal Server Error Occured!" });
                            } 
                            else {
                                res.status(200).json({ username, usergroup: result2, taskDetails: rows });
                            }
                        });
                    }
                    else {
                        res.status(400).json({ message: "Your account has been disabled" });
                    }
                })
            }
            else {
                res.status(401).json({ message: 'Invalid Authentication Credentials' });
            }
        }
        else {
            res.status(401).json({ message: 'Username not exist in database!' });
        }
    });
}

/** Create a new task */
exports.post_create_task = function(req, res) {
    const {appname, taskname, taskdescription, tasknotes, pname} = req.body;
    console.log(appname, taskname, taskdescription, tasknotes, pname)
    const sql = "SELECT * FROM application WHERE app_acronym = ?";
    db.query(sql, [appname], function(error, result) {
        if (error) {
            res.status(500).json({
                message: "Internal Server Error Occured!"
            })
        }
        else {
            const newTaskID = `${result[0].app_acronym}_${result[0].app_Rnumber+1}`;
            const logonUID = req.session.username;
            const currentState = "open";
            const date = new Date().toLocaleString();
            const auditlog = `User ${logonUID} added:\n${tasknotes}, ${currentState}, ${date}`;
            const taskCreateDate = new Date();
    
            const sql2 = `INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, 
                task_app_acronym, task_state, task_creator, task_owner, task_createDate) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql2, [newTaskID, taskname, taskdescription, auditlog, pname, appname, currentState, 
                req.session.username, req.session.username, taskCreateDate], async function(error, row, fields) {
                if (error) {
                    console.log(error);
                }
                else {
                    const newRnumber = result[0].app_Rnumber + 1;
                    const sql4 = "UPDATE application SET app_Rnumber = ? WHERE app_acronym = ?";
                    db.query(sql4, [newRnumber, appname], async function(error, result) {
                        if (error) throw error;
                        console.log("AppRnumber updated!");
                    })
                }
                res.status(200).json({ 
                    message: 'Task created successfully!', userLoggedIn: req.session.username
                });
           });
        }
    });
}