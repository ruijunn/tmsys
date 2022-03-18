const mysql = require('mysql'); 
const bcrypt = require('bcrypt');
const group = require('../group');

/** Database connection */
const db = mysql.createConnection({
  connectionLimit : 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

/* Display user list page */
exports.user_list = async function(req, res) {
  // check if username belong to admin group
  if (await group.checkGroup(req.session.username, "admin")) {
    var userList = [];
    db.query('SELECT * FROM accounts', function(err, rows, fields) {
      if (err) {
        console.log(err);
      } else {
        // Loop check on each row
        for (var i = 0; i < rows.length; i++) {
          // Create an object to save current row's data
          var user = {
            'id': rows[i].id,
            'username': rows[i].username,
            'email': rows[i].email,
            'role': rows[i].role,
            'status': rows[i].status
          }
          userList.push(user); // Add object into array
      }
      res.render('details', {
        isLoggedIn: req.session.isLoggedIn, 
        "userList": userList}); // Render details.pug page using array 
      }
    });
  }
  // check if username belong to user group
  if (await group.checkGroup(req.session.username, "user")) {
    console.log("User is not an admin, not authorized!");
    res.redirect('/home');
  }
}

var user;

/* Display the edit user form based on the id that is selected in details.pug page */
exports.get_edit_user = function(req, res) {
  var id = req.params.id;
  db.query('SELECT * FROM accounts WHERE id = ?', [id], function(err, rows, fields) {
    if (err) {
      console.log(err);
    } 
    else {
      user = rows;
      //console.log(user);
      res.render('editUser', {isLoggedIn: req.session.isLoggedIn, "userA": user}) 
    }
  });
}

/* Edit account details of a user by ID */
exports.edit_user = async function(req, res) {
  const { id, password, email, status } = req.body;
  const hashedPassword = await bcrypt.hash(password,bcrypt.genSaltSync(10));
  const sql = "UPDATE accounts SET password = ?, email = ?, status = ? WHERE id = ?";
  db.query(sql, [hashedPassword, email, status, id], function(err, rows, fields) {
    if (err) {
      console.log(err);
    }
    else {
      //console.log(rows);
      db.query('SELECT * FROM accounts WHERE id = ?', [id], function(err, rows, fields) {
        if (err) {
          console.log(err);
        } 
        else {
          user = rows;
          //console.log(user);
        }
      });
      console.log("Account edited successfully!")
      res.redirect('/details'); // redirect back to details.pug page after edited successfully
      //res.render('editUser', {success: 'Account edited successfully!', "userA": user});
    }
  });
}