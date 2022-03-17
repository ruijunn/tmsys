const mysql = require('mysql'); 

const db = mysql.createConnection({
    connectionLimit : 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

// function to check if user exists in a group
exports.checkGroup = async (userid, groupname) => {
    // create promise with resolve and reject as params
    return new Promise((resolve, reject) => {
        const sql = "SELECT groupName FROM usergrp WHERE id = ?";
        db.query(sql, [userid], (error, result) => {
            if (error) throw error;
            if(result.length > 0) {
                const gname = result[0].groupName;
                if (gname === groupname) {
                    resolve(gname);
                }
                else {
                    resolve(false);
                }
            }
        });
    })
};