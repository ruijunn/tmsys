const db = require('../dbServer'); 
const group = require('../checkGroup');

exports.user_group = async function(req, res) {
    if (await group.checkGroup(req.session.username, "admin")) {
        console.log("User is an admin");
        res.render('createGroup', {isLoggedIn: req.session.isLoggedIn}); // redirect to create user page
    }
    // check if username belong to user group
    if (await group.checkGroup(req.session.username, "user")) {
        console.log("User is not an admin, not authorized!");
        res.redirect('/home'); // redirect to home page
    }
}

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