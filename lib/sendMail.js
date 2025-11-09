const nodeMailer = require('nodemailer');
const config = require('config');


const emailTransporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.get("email"),
        pass: config.get("password")
    }
});


const sendMail = async (to, subject, html) => {
    const mailOptions = {
           from: config.get("email"),
           to,
           subject,
           html
       };
  await emailTransporter.sendMail(mailOptions);

};

module.exports = sendMail;