const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to self
    subject: 'Emyris Test Email',
    text: 'If you see this, email integration is working!'
};

console.log('Attempting to send test email to:', process.env.EMAIL_USER);

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('❌ Email Failed:', error.message);
        if (error.message.includes('Invalid login')) {
            console.error('Tip: Check if EMAIL_PASS is a 16-character App Password, not your regular Gmail password.');
        }
    } else {
        console.log('✅ Email Sent Successfully:', info.response);
    }
    process.exit();
});
