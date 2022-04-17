const db = require('../dbServer'); 
const group = require('../checkGroup');
const alert = require('alert');

/** Global variables */
var userList = [];
var selectArray = [];
var deleteArray = [];

/** Display create group page */
exports.user_group = async function(req, res) {
    if (await group.checkGroup(req.session.username, "admin")) {
        res.render('createGroup', {isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username}); // redirect to create user page
    }
    // check if username belong to user group
    else {
        alert("You are not authorized to view this page!");
        res.redirect('/home');
    }
}

/** Handle form submit for create group */
exports.user_group_create = async function(req, res) {
    const {groupname} = req.body;
    if (groupname) {
        const sql = "SELECT * FROM usergrp WHERE groupName = ?";
        db.query(sql, [groupname], function(error, result) {
            if (error) throw error;
            if (result.length === 0) { // if user group not exists in db
                const sql2 = "INSERT INTO usergrp (groupName) VALUES (?)";
                db.query(sql2, [groupname], function (error, result) {
                    if (error) throw error; 
                    res.render('createGroup', {success: 'New group created successfully!'});
                });
            }
            else { // existing group, display error message
                res.render('createGroup', {error: 'Group name already exists!'});
            }
        });
    }
    else {
        res.render('createGroup', {error: 'Please enter a group name!'});
    }
}

/** Display all usernames in listUsers.pug */
exports.user_list = async function(req, res) {
    // check if username belongs to admin group
    if (await group.checkGroup(req.session.username, "admin")) {
        //var userList = [];
        db.query('SELECT username FROM accounts', function(err, rows, fields) {
            if (err) {
                console.log(err);
            } else {
                user = rows;
                var uList = [];
                // Loop check on each row
                for (var i = 0; i < rows.length; i++) {
                // Create an object to save current row's data
                    var user = {
                        'username': rows[i].username
                    }
                    uList.push(user); // Add object into array
                }
                userList = uList;
            }
            res.render('listUsers', {
                isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username, "userList": userList
            }); // Render listUsers.pug page using array 
        });
    }
    else { // if username not belong to admin group
        alert("You are not authorized to view this page!");
        res.redirect('/home');
    }
}

/* Display the assign group form based on the username that is selected in listUsers.pug page */
exports.get_user_group = async function(req, res) {
    var username = req.params.username;
    // console.log(username);
    db.query('SELECT * FROM usergrp_list WHERE username = ?', [username], function(err, rows, fields) {
        if (err) {
            console.log(err);
        } 
        else {
            user = rows;
            var tempArray = [];
            const allgrps = req.body;
            db.query('SELECT groupName FROM usergrp', [allgrps], function(err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                else {
                    // Loop check on each row
                    for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                        var s = {
                            'groupname': rows[i].groupName
                        }
                        tempArray.push(s); // Add object into array
                    }
                }
                selectArray = tempArray;
                res.render('assignGroup', {isLoggedIn: req.session.isLoggedIn, 
                    userLoggedIn: req.session.username, "userA": username, "userG": user, "selectArray": selectArray
                });
            });
        }
    });
}

/* Handle form submit for assigning group to a user by username */
exports.post_user_group = async function(req, res) {
    var username = req.params.username;
    const {allgrps} = req.body;
    if (allgrps) {
        const sql = "INSERT INTO usergrp_list (username, groupname) VALUES (?, ?)";
        db.query(sql, [username, allgrps], function (error, result) {
            if (error) {
                console.log(error);
            }
            else {
                db.query("SELECT * FROM usergrp_list WHERE username = ?", [username], function(error, result) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log(result);
                    }
                });
            }
            res.render('assignGroup', { 
                success: 'Successfully assigned group!', 
                "userA": username, "userG": user, 
                "selectArray": selectArray
            });
        });
       /*  db.query("SELECT * FROM usergrp_list WHERE username = ?", [username], function(error, result) {
            if (error) throw error;
            const sql = "INSERT INTO usergrp_list (username, groupname) VALUES (?, ?)";
            db.query(sql, [username, allgrps], function (error, result) {
                if (error) throw error;
                res.render('assignGroup', { 
                    success: 'Successfully assigned group!', 
                    "userA": username, "userG": user, 
                    "selectArray": selectArray
                });
            });
        }) */
    }
    else {
        res.render('assignGroup', { 
            error: 'Please select a group to assign the user!', 
            "userA": username, "userG": user, "selectArray": selectArray
        });
    }
}

/* Display the remove group form based on the username that is selected in listUsers.pug page */
exports.get_delete_user_group = async function(req, res) {
    var username = req.params.username;
    db.query('SELECT * FROM usergrp_list WHERE username = ?', [username], function(err, rows, fields) {
        if (err) {
            console.log(err);
        } 
        else {
            var dList = [];
            db.query('SELECT groupname FROM usergrp_list WHERE username = ?', [username], function(err, rows, fields) {
                if (err) {
                    console.log(err);
                }
                else {
                    // Loop check on each row
                    for (var i = 0; i < rows.length; i++) {
                    // Create an object to save current row's data
                        var d = {
                            'groupname': rows[i].groupname
                        }
                        dList.push(d); // Add object into array
                    }
                }
                deleteArray = dList;
                // console.log("sss", deleteArray);
                res.render('removeGroup', {isLoggedIn: req.session.isLoggedIn, 
                    userLoggedIn: req.session.username, "userA": username, "deleteArray": deleteArray
                });
            });
        }
    });
}

/* Handle form submit for deleting group to a user by username */
exports.delete_user_group = async function(req, res) {
    var username = req.params.username;
    const {selectedGrp} = req.body;
    if (selectedGrp) {
        const sql = "DELETE FROM usergrp_list WHERE username = ? AND groupname = ?";
        db.query(sql, [username, selectedGrp], function (error, result) {
            if (error) {
                console.log(error);
            }
            else {
                db.query("SELECT * FROM usergrp_list WHERE username = ?", [username], function(error, result) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log(result);
                    }
                });
            }
            res.render('removeGroup', { 
                success: 'Successfully deleted the assigned group!', 
                "userA": username, "deleteArray": deleteArray
            });
        });
        /* db.query("SELECT * FROM usergrp_list WHERE username = ?", [username], function(error, result) {
            if (error) throw error;
            const sql = "DELETE FROM usergrp_list WHERE username = ? AND groupname = ?";
            db.query(sql, [username, selectedGrp], function (error, result) {
                if (error) throw error;
                res.render('removeGroup', { 
                    success: 'Successfully deleted the assigned group!', 
                    "userA": username, "deleteArray": deleteArray
                });
            });
        }) */
    }
    else {
        res.render('removeGroup', { 
            error: 'Please select a group to delete for the user!', 
            "userA": username, "deleteArray": deleteArray
        });
    }
}