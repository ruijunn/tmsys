const db = require('../dbServer'); 
const moment = require('moment');
const group = require('../checkGroup');
const alert = require('alert');

/** Global variables */
var appList = [];

exports.appList2 = async function(req, res) {
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
            res.render('tmsysLeftFrame', {
                isLoggedIn: req.session.isLoggedIn, userLoggedIn: req.session.username, "appList": appList
            }); // Render applicationList.pug page using array 
        }
    });
}