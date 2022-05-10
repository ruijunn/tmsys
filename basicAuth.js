const db = require('./dbServer'); 
const bcrypt = require('bcrypt');

exports.basicAuth = async function(req, res, next) {
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }
    // verify auth credentials
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    db.query("SELECT * FROM accounts WHERE username = ?", [username], async (error, results, fields) => {
        if (error) {
            res.status(500).json({ message: "Internal Server Error Occured!" });
        } 
        else {
            const validPwd = await bcrypt.compare(password, results[0].password); 
            if (username && validPwd) {
                if (results[0].status === 1) {
                    req.username = username;
                    return next();
                }
                else {
                    res.status(400).json({ message: "Your account has been disabled" });
                }
            }
            else {
                res.status(401).json({ message: 'Invalid Authentication Credentials' });
            }
        }
    });
}

