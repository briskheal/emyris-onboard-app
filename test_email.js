const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.in',
    port: 465,
    secure: true,
    auth: {
        user: 'hradmin@emyrishr.in',
        pass: 'ijKSY6v0yqRX'
    }
});

transporter.sendMail({
    from: '"Emyris HR" <hradmin@emyrishr.in>',
    to: 'hradmin@emyrishr.in',
    subject: 'SMTP Test - Emyris HR Portal is Live!',
    html: `
        <div style="font-family:Arial,sans-serif;padding:30px;background:#f8fafc;border-radius:12px;">
            <h2 style="color:#3e84f4;">✅ Emyris HR Portal - Email Test</h2>
            <p>This is a test email confirming that Zoho SMTP is working correctly on your live server.</p>
            <p>Sample PIN: <b style="font-size:1.5em;color:#3e84f4;">452327</b></p>
            <hr>
            <p style="color:#64748b;font-size:0.85em;">Sent from emyrishr.in via Zoho SMTP</p>
        </div>
    `
}).then(info => {
    console.log('✅ Test email sent! MessageID:', info.messageId);
    process.exit(0);
}).catch(e => {
    console.error('❌ Send Error:', e.message);
    process.exit(1);
});
