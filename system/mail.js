const { createTransport } = require('nodemailer');

let mailTransporter = null;
function init() {
  try{
    mailTransporter = createTransport(process.env.SMTP_URL || {
      host:'smtp.sendgrid.net',
      port:587,
      auth: {
        user: 'apikey',
        pass: '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'
      }
    } || {
      service: 'gmail',
        auth: {
          //user: 'vendomrtn@gmail.com',
          user: 'support@mein-vendo.de',
          //pass: 'Qwertyuiop@123'
          pass : 'C8G99q2nWCxf0ey1'
      }    });
  }catch(e){
    console.log(e);
    mailTransporter = null;
  }
}

exports.sendMail = (mailDetails) => {
  if(!mailTransporter){
    reject(new Error("Mail not configured"));
    console.log('Mail not configured');
    return;
  }
  return new Promise((resolve, reject) => {
      mailTransporter.sendMail(mailDetails, (err, data) => {
          if (err) {
             console.log('Email Error Occurs',err);
              reject(err)
              
          } else {
              console.log('Email sent successfully');
              resolve(data)
              
          }
      });
  })
}

init();
