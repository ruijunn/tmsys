const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "a815546a4d4cfc",
      pass: "a4b43b9f35679c"
    }
});

module.exports = transporter;