const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const resendSecret = process.env.RESEND_API_KEY;
const resend = resendSecret ? new Resend(resendSecret) : null;
const bridgeUrl = process.env.EMAIL_BRIDGE_URL;

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function runTest() {
    const to = process.env.EMAIL_USER || "test@example.com";
    const from = process.env.EMAIL_FROM || `"Emyris Test" <${process.env.EMAIL_USER}>`;
    const subject = 'Emyris Email Integration Test';
    const html = '<h3>SUCCESS!</h3><p>If you see this, your email configuration for <b>Emyris Onboard</b> is correctly set up.</p>';

    if (resend) {
        console.log('🚀 Testing via RESEND API...');
        try {
            const { data, error } = await resend.emails.send({
                from: "Emyris HR <hr@emyrisbio.com>",
                to,
                subject,
                html,
            });
            if (error) {
                if (error.message.includes('not verified')) {
                   console.log('⚠️ INFO: Domain not verified yet. Testing with onboarding@resend.dev...');
                   const retry = await resend.emails.send({ from: "Emyris HR <onboarding@resend.dev>", to, subject, html });
                   console.log('✅ Sent via Resend default account:', retry.data);
                } else {
                   console.error('❌ Resend API Error:', error);
                }
            } else {
                console.log('✅ Resend test email sent successfully!', data);
            }
        } catch (e) {
            console.error('❌ Unexpected Resend Error:', e.message);
        }
    } else {
        console.log('✉️ Testing via ZOHO SMTP (Nodemailer)...');
        try {
            const info = await transporter.sendMail({ 
                from, // Uses process.env.EMAIL_FROM || Emyris Test <EMAIL_USER>
                to, 
                subject, 
                html 
            });
            console.log('✅ SMTP test email sent successfully!', info.response);
        } catch (e) {
            console.error('❌ SMTP Error:', e.message);
            if (e.message.includes('Invalid login')) {
                console.warn('Tip: Check if EMAIL_PASS is a 12/16-character Zoho App Password.');
            }
        }
    }
    process.exit();
}

runTest();
