const db = require('../dbServer'); 
const group = require('../checkGroup');
const transporter = require('../email');

/** Retrieve tasks in a particular state */
exports.task_by_state = async function(req, res) {
    const state = req.query.state;
    if (state) { // check if inputed state is empty
        if (state.includes(' ') || state === state.toUpperCase()) { // check if inputed state has spacing or in upper case
            res.status(400).json({ message: "Invalid input!" });
        }
        else {
            db.query("SELECT * FROM task WHERE task_state = ? ORDER BY task_id", [state], function(err, results, fields) {
                if (err) {
                    res.status(500).json({ message: "Internal Server Error Occured!" });
                } 
                else {
                    res.status(200).json({ results });
                }
            });
        }
    }
    else {
        res.status(400).json({ message: 'Please enter a state!' });
    }
}

/** Create a new task */
exports.create_task = async function(req, res) {
    const {appname, taskname, taskdescription, tasknotes, pname} = req.body;
    db.query("SELECT * FROM application WHERE app_acronym = ?", [appname], async function(error, rows) {
        if (await group.checkGroup(req.username, rows[0].app_permit_createTask)) {
            const newTaskID = `${rows[0].app_acronym}_${rows[0].app_Rnumber+1}`;
            const logonUID = req.username;
            const currentState = "open";
            const date = new Date().toLocaleString();
            const auditlog = `User ${logonUID} added:\n${tasknotes}, ${currentState}, ${date}`;
            const taskCreateDate = new Date();

            if (pname == "") { 
                const sql2 = `INSERT INTO task (task_id, task_name, task_description, task_notes,
                    task_app_acronym, task_state, task_creator, task_owner, task_createDate) 
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.query(sql2, [newTaskID, taskname, taskdescription, auditlog, appname, currentState, 
                    req.username, req.username, taskCreateDate], async function(error, row, fields) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        const newRnumber = rows[0].app_Rnumber + 1;
                        const sql4 = "UPDATE application SET app_Rnumber = ? WHERE app_acronym = ?";
                        db.query(sql4, [newRnumber, appname], async function(error, result) {
                            if (error) throw error;
                            console.log("AppRnumber updated!");
                        })
                    }
                    res.status(200).json({ message: 'Task created successfully!' });
                });
            }
            else { 
                const sql2 = `INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, 
                    task_app_acronym, task_state, task_creator, task_owner, task_createDate) 
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.query(sql2, [newTaskID, taskname, taskdescription, auditlog, pname, appname, currentState, 
                    req.username, req.username, taskCreateDate], async function(error, row, fields) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        const newRnumber = rows[0].app_Rnumber + 1;
                        const sql4 = "UPDATE application SET app_Rnumber = ? WHERE app_acronym = ?";
                        db.query(sql4, [newRnumber, appname], async function(error, result) {
                            if (error) throw error;
                            console.log("AppRnumber updated!");
                        })
                    }
                    res.status(200).json({ message: 'Task created successfully!' });
                });
            }

            
        }
        else {
            res.status(401).json({ message: 'You are not authorized to perform this action!' });
        }
    });
}

/** Promote task from doing to done state */
exports.promote_task = async function(req, res) {
    const { tid, t_state } = req.body;
    db.query("SELECT * FROM task WHERE task_id = ?", [tid], function(error, result) {
        db.query("SELECT * FROM application WHERE app_acronym = ?", [result[0].task_app_acronym], async function(error, result2, fields) {
            if (await group.checkGroup(req.username, result2[0].app_permit_doing)) {  // check the app permit
                if (result[0].task_state !== 'doing') { // check if current state is doing or not
                    res.status(400).json({ message: `Task ${result[0].task_id} is not in doing state!` });
                }
                else { 
                    if (t_state) { // check if inputed state is empty
                        if (t_state.includes(' ')) {   // check if inputed state has spacing
                            res.status(400).json({ message: "Cannot have spacings!" });
                        }
                        const state = t_state.toLowerCase(); // convert the inputed state to lower case

                        const sqlQuery = "UPDATE task SET task_state = ?, task_owner = ? WHERE task_id = ?";
                        db.query(sqlQuery, [state, req.username, tid], async function(error, result3) {
                            if (error) throw error;
                            res.status(200).json({ tid, currentState: result[0].task_state, targetState: state });
                        })
    
                        // ============================ GET TEAM MEMBER EMAIL =================================
                        var getMemberEmailSQL = "SELECT email FROM accounts WHERE username = ?";
                        var sendList = [];
                        db.query(getMemberEmailSQL, [req.username], async function(err, result4, fields) {
                            for (x in result4) {
                                if (await group.checkGroup(req.username, result2[0].app_permit_doing)) {
                                    sendList.push(result4[x].email)
                                }
                            }
                            console.log(sendList); 
                        }); 
    
                        // ============================ GET PROJECT LEAD EMAIL =================================
                        const getLeadEmailSQL = 'SELECT email FROM accounts where username IN (SELECT username FROM usergrp_list where groupname IN (SELECT app_permit_done FROM application where app_permit_done = ?))';
                        var toList = [];
                        db.query(getLeadEmailSQL, [result2[0].app_permit_done], function(err, result5, fields) {
                            for (k in result5) {
                                toList.push(result5[k].email);
                            }
                            console.log(toList);
                        });
                
                        var message = {
                            from: sendList,
                            to: toList,
                            subject: `Seek Approval of Task ${result[0].task_id}`,
                            text: `Task ${result[0].task_id} is completed by ${result[0].task_owner} and is in the done state, awaiting your approval to close task.`
                        }
                
                        transporter.sendMail(message, function(err, info) {
                            if (err) {
                                console.log(err)
                            } else {
                                console.log(info);
                            }
                        });
                    }
                    else {
                        res.status(400).json({ message: "Target state not inputed!" });
                    }
                }
            }
            else {
                res.status(401).json({ message: 'You are not authorized to perform this action!' });
            }
        });
    });
}