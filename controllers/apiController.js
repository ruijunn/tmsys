const db = require('../dbServer'); 
const group = require('../checkGroup');
const transporter = require('../email');

/** Retrieve tasks in a particular state */
exports.task_by_state = async function(req, res) {
    const state = req.query.state;
    db.query("SELECT * FROM task WHERE task_state = ? ORDER BY task_id", [state], function(err, results, fields) {
        if (err) {
            res.status(500).json({ message: "Internal Server Error Occured!" });
        } 
        else {
            res.status(200).json({ results });
        }
    });
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
            if (result2[0].task_state === 'doing' && await group.checkGroup(req.username, result2[0].app_permit_doing)) {
                if (t_state === 'done') {
                    const sqlQuery = "UPDATE task SET task_state = ?, task_owner = ? WHERE task_id = ?";
                    db.query(sqlQuery, [t_state, req.username, tid], async function(error, result3) {
                        if (error) throw error;
                        res.status(200).json({ tid, currentState: result2[0].task_state, targetState: t_state });
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
                else {
                    res.status(400).json({ message: 'No tasks to be promoted!' });
                }
            }
            else {
                res.status(401).json({ message: 'You are not authorized to perform this action!' });
            }
        });
    });


    // verify auth credentials
    /* const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    db.query("SELECT * FROM accounts WHERE username = ?", [username], async (error, results, fields) => {
        if (error) throw error;
        if (results.length > 0) {
            const validPwd = await bcrypt.compare(password, results[0].password); 
            if (username && validPwd) {
                if (results[0].status === 1) { 
                    req.session.username = username;
                    if (await group.checkGroup(req.session.username, "project lead") ||  await group.checkGroup(req.session.username, "project manager") ||
                    (await group.checkGroup(req.session.username, "team member")) ) {
                        const { tid, notes, t_state } = req.body;
                        console.log(tid);
                        db.query("SELECT * FROM task WHERE task_id = ?", [tid], function(error, result2) {
                            db.query("SELECT * FROM application WHERE app_acronym = ?", [result2[0].task_app_acronym], async function(error, result3, fields) {
                                let task_notes = result2[0].task_notes;
                                let targetState;
                                let currentState = result2[0].task_state;
                                if (t_state) {
                                    targetState = t_state
                                }
                                else {
                                    targetState = currentState;
                                }
                                var date = new Date().toLocaleString();
                                var audit_log = `User ${req.session.username} updated: ${notes}, ${targetState}, ${date}\n${task_notes}`;
                                console.log(audit_log);

                                if (result2[0].task_state === 'open' && await group.checkGroup(req.session.username, result3[0].app_permit_open)) {
                                    if (t_state === 'todolist') {
                                        const sqlQuery = "UPDATE task SET task_notes = ?, task_state = ?, task_owner = ? WHERE task_id = ?";
                                        db.query(sqlQuery, [audit_log, t_state, req.session.username, tid], async function(error, result4) {
                                            if (error) throw error;
                                            res.status(200).json({ tid, task_notes, existingState: result2[0].task_state, targetState: t_state });
                                        });
                                    }
                                }
                                else if (result2[0].task_state === 'todolist' && await group.checkGroup(req.session.username, result3[0].app_permit_toDoList)) {
                                    if (t_state === 'doing') {
                                        const sqlQuery = "UPDATE task SET task_notes = ?, task_state = ?, task_owner = ? WHERE task_id = ?";
                                        db.query(sqlQuery, [audit_log, t_state, req.session.username, tid], async function(error, result4) {
                                            if (error) throw error;
                                            res.status(200).json({ tid, task_notes, existingState: result2[0].task_state, targetState: t_state });
                                        });
                                    }
                                }
                                else if (result2[0].task_state === 'doing' && await group.checkGroup(req.session.username, result3[0].app_permit_doing)) {
                                    if (t_state === 'todolist') {
                                        const sqlQuery = "UPDATE task SET task_notes = ?, task_state = ?, task_owner = ? WHERE task_id = ?";
                                        db.query(sqlQuery, [audit_log, t_state, req.session.username, tid], async function(error, result4) {
                                            if (error) throw error;
                                            res.status(200).json({ tid, task_notes, existingState: result2[0].task_state, targetState: t_state });
                                        });
                                    }
                                    else if (t_state === 'done') {
                                        const sqlQuery = "UPDATE task SET task_notes = ?, task_state = ?, task_owner = ? WHERE task_id = ?";
                                        db.query(sqlQuery, [audit_log, t_state, req.session.username, tid], async function(error, result4) {
                                            if (error) throw error;
                                            res.status(200).json({ tid, task_notes, existingState: result2[0].task_state, targetState: t_state });
                                        });

                                        var emailSQL = "SELECT email FROM accounts WHERE username = ?";
                                        var sendList = [];
                                        db.query(emailSQL, [req.session.username], async function(err, result5, fields) {
                                            for (x in result5) {
                                                if (await group.checkGroup(req.session.username, "team member")) {
                                                    sendList.push(result5[x].email)
                                                }
                                            }
                                            console.log(sendList); 
                                        }); 

                                        const sql = 'SELECT email FROM accounts where username IN (SELECT username FROM usergrp_list WHERE groupname = "project lead")';
                                        var toList = [];
                                        db.query(sql, function(err, result6, fields) {
                                            for (k in result6) {
                                                toList.push(result6[k].email);
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
                                else if (result2[0].task_state === 'done' && await group.checkGroup(req.session.username, result3[0].app_permit_done)) {
                                    if (t_state === 'doing') {
                                        const sqlQuery = "UPDATE task SET task_notes = ?, task_state = ?, task_owner = ? WHERE task_id = ?";
                                        db.query(sqlQuery, [audit_log, t_state, req.session.username, tid], async function(error, result4) {
                                            if (error) throw error;
                                            res.status(200).json({ tid, task_notes, existingState: result2[0].task_state, targetState: t_state });
                                        });
                                    }
                                    else if (t_state === 'close') {
                                        const sqlQuery = "UPDATE task SET task_notes = ?, task_state = ?, task_owner = ? WHERE task_id = ?";
                                        db.query(sqlQuery, [audit_log, t_state, req.session.username, tid], async function(error, result4) {
                                            if (error) throw error;
                                            res.status(200).json({ tid, task_notes, existingState: result2[0].task_state, targetState: t_state });
                                        });
                                    }
                                    
                                }
                                else if (result2[0].task_state === 'close') {
                                    const sqlQuery = "UPDATE task SET task_notes = ?, task_state = ?, task_owner = ? WHERE task_id = ?";
                                    db.query(sqlQuery, [audit_log, targetState, req.session.username, tid], async function(error, result4) {
                                        if (error) throw error;
                                        res.status(200).json({ tid, task_notes, existingState: targetState });
                                    }); 
                                }
                                else {
                                    res.status(401).json({ message: 'You are not authorized to update the state!', username });
                                }
                            });
                        });
                    }
                    else {
                        res.status(401).json({ message: 'You are not authorized to perform this action!', username });
                    }
                }
                else {
                    res.status(400).json({ message: "Your account has been disabled", username });
                }
            }
            else {
                res.status(401).json({ message: 'Invalid Authentication Credentials', username });
            }
        }
        else {
            res.status(401).json({ message: 'Username not exist in database!' });
        }
    }); */
}