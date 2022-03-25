const db = require('./dbServer'); 

// function to check if user exists in a group
exports.checkGroup = async (username, groupname) => {
    // create promise with resolve and reject as params
    return new Promise((resolve, reject) => {
        const sql = "SELECT groupname FROM usergrp_list WHERE username = ?";
        db.query(sql, [username], (error, result) => {
            if (error) throw error;
            for (var i = 0; i < result.length; i++) {
                //console.log(result[i].groupname);
                if (result[i].groupname === groupname) {
                    resolve(true);
                }
            }
            resolve(false);
            /* const gname = result[0].groupname;
            if (gname === groupname) {
                resolve(gname);
            }
            else {
                resolve(false);
            } */
        })
    })
};