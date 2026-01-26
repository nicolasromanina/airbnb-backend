// Simple SMTP tester using nodemailer
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Test SMTP from booking-backend',
      text: 'This is a test email sent from testSmtp.js',
    });

    console.log('Mail sent:', info);
  } catch (err) {
    console.error('Error sending mail:', err);
    process.exitCode = 1;
  }
})();