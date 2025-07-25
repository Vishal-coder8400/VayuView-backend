const nodemailer = require('nodemailer');

// Function to send an email
exports.sendMail = async (to, subject, text) => {
  try {
    // Create a transporter using SMTP transport
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: '', // your email address
        pass: ''
      },
    });

    // Setup email data
    const mailOptions = {
      from: '', // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
      html: text, // plain text body
    };

    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email: ', error.message);
    return false;
  }
};

// // Example usage
// const toEmail = 'parthgabab@gmail.com';
// const emailSubject = 'Test Email';
// const emailText = 'This is a test email from LB';
// sendMail(toEmail, emailSubject, emailText)