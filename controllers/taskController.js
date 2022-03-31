const db = require('../dbServer'); 
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
    if (appname, taskname, taskdescription, tasknotes, pname) {
        const sql = "SELECT task_name FROM task WHERE task_name = ?";
        db.query(sql, [taskname], function(error, result) {
            if (error) throw error;
            if (result.length === 0) { // if taskname not exists in db, then create new task
                const sql2 = `INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, 
                    task_app_acronym, task_state, task_creator, task_owner, task_createDate) 
                    VALUES(?, ?, ?, ?, ?, ?, "open", ?, ?, ?)`;
                db.query(sql2, [appname, taskname, taskdescription, tasknotes, pname], function(error, result) {
                    if (error) throw error;
                    res.render('createTask', {success: 'Task created successfully!', 
                    "applicationArray": applicationArray, "planArray": planArray});
                });
            }
            else { // existing task name, display error message
                res.render('createTask', {error: 'Task name already exists!', 
                "applicationArray": applicationArray, "planArray": planArray});
            }
        });
    }
    else {
        res.render('createTask', {error: 'Please enter task details!', 
        "applicationArray": applicationArray, "planArray": planArray});
    }
}