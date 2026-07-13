const express = require('express');
const router = express.Router();
const { Applicant, Company, ExamResult } = require('../db');
const { sendEmail } = require('../utils/mailer');
const { syncActiveExamForApplicant } = require('../utils/examSync');


// Login Endpoint
router.post('/applicant-login', async (req, res, next) => {
    let { email, pin } = req.body;
    email = (email || '').trim().toLowerCase();
    pin = (pin || '').trim();

    try {
        let applicant = await Applicant.findOne({ email, pin });
        if (!applicant) {
            return res.json({ success: false, message: 'Invalid credentials. If you lost your PIN, register again with the same email to receive a new one.' });
        }
        if (!applicant.canLogin) {
            return res.json({ success: false, message: 'Your application is blocked or under review.' });
        }
        applicant = await syncActiveExamForApplicant(applicant);
        return res.json({ success: true, applicant });
    } catch (err) {
        console.error("Login Error:", err);
        return res.json({ success: false, message: 'System error during login.' });
    }
});

// Alias for React frontend - directly calls same handler as /register-applicant
router.post('/applicant/register', (req, res) => {
    return handleRegister(req, res);
});

async function handleRegister(req, res) {
    let { title, fullName, email, phone, division, designation } = req.body;
    email = (email || '').trim().toLowerCase();
    let pin = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        const existingEmail = await Applicant.findOne({ email });
        if (existingEmail) {
            return res.json({ success: false, isReturning: true, message: 'Welcome back! This email is already registered. Please log in to continue your journey.' });
        }
        const existingPhone = await Applicant.findOne({ phone });
        if (existingPhone) {
            return res.json({ success: false, isReturning: true, message: 'Welcome back! This phone number is already registered.' });
        }

        const newApplicant = await Applicant.create({
            email, title, fullName, phone, division, designation, pin,
            password: Math.random().toString(36).slice(-8),
            status: 'draft',
            canLogin: true,
            formData: {
                title, fullName, email, phone, division, designation
            }
        });

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Welcome to Emyris Biolifesciences!</h2>
                <p>Dear ${title} ${fullName},</p>
                <p>Thank you for registering. You can now log into your Applicant Portal to complete your onboarding process.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>Login Portal:</strong> <a href="${process.env.BASE_URL || 'https://emyrishr.in'}">${process.env.BASE_URL || 'https://emyrishr.in'}</a></p>
                    <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Your Email:</strong> ${email}</p>
                    <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Your PIN:</strong> <span style="font-size: 20px; font-weight: bold; color: #e74c3c;">${pin}</span></p>
                </div>
                <p>Please keep this PIN secure. You will need it to log in and check your application status.</p>
                <br/>
                <p>Best regards,<br/><strong>HR Department</strong><br/>Emyris Biolifesciences</p>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: 'Application Received - Emyris Biolifesciences',
            html: emailHtml
        });

        const syncedApplicant = await syncActiveExamForApplicant(newApplicant);
        res.json({ success: true, applicant: syncedApplicant, pin: pin });
    } catch (err) {
        console.error('Registration error:', err);
        res.json({ success: false, message: 'Failed to register applicant. Ensure database is connected.' });
    }
}

router.post('/register-applicant', async (req, res) => {
    return handleRegister(req, res);
});

// Resend PIN
router.post('/resend-pin', async (req, res) => {
    let { email } = req.body;
    email = (email || '').trim().toLowerCase();
    try {
        const applicant = await Applicant.findOne({ email });
        if (!applicant) {
            return res.json({ success: false, message: 'Email not found in our records.' });
        }
        
        const pin = applicant.pin || Math.floor(100000 + Math.random() * 900000).toString();
        
        if (!applicant.pin) {
            await Applicant.findByIdAndUpdate(applicant._id, { pin });
        }

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Your Login PIN</h2>
                <p>Dear ${applicant.title} ${applicant.fullName},</p>
                <p>As requested, here are your login details for the Applicant Portal:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>Your Email:</strong> ${email}</p>
                    <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Your PIN:</strong> <span style="font-size: 20px; font-weight: bold; color: #e74c3c;">${pin}</span></p>
                </div>
                <p>Best regards,<br/><strong>HR Department</strong><br/>Emyris Biolifesciences</p>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: 'Your Login PIN - Emyris Biolifesciences',
            html: emailHtml
        });

        res.json({ success: true, message: 'PIN has been sent to your email.' });
    } catch (err) {
        console.error('Resend PIN error:', err);
        res.json({ success: false, message: 'System error. Please try again later.' });
    }
});

module.exports = router;
