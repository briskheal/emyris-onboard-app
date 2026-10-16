const express = require('express');
const router = express.Router();
const { Applicant, Company, ExamResult } = require('../db');
const { sendEmail } = require('../utils/mailer');
const { syncActiveExamForApplicant } = require('../utils/examSync');


// Login Endpoint
router.post('/applicant-login', async (req, res, next) => {
    let { email, pin, password } = req.body;
    email = (email || '').trim().toLowerCase();
    const passwordPin = (password || pin || '').trim();

    try {
        let applicant = await Applicant.findOne({ email });
        if (!applicant) {
            return res.json({ success: false, message: 'Invalid credentials. If you lost your Password PIN, please use Forgot PIN.' });
        }

        const isMatch = (applicant.password && applicant.password.trim() === passwordPin);

        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid credentials. If you lost your Password PIN, please use Forgot Password PIN.' });
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

// Helper to get allowed access codes strictly from environment variables (.env)
function getAllowedAccessCodes() {
    const raw = (
        process.env.REGISTRATION_ACCESS_CODE || 
        process.env.HR_ACCESS_CODE || 
        process.env.ACCESS_CODE || 
        process.env.ONBOARDING_ACCESS_CODE || 
        ''
    ).replace(/['"]/g, '').trim();

    if (raw) {
        return raw.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    }
    return ['EMYRIS2026'];
}

function getAccessCodeErrorMessage() {
    const email = (
        process.env.REGISTRATION_SUPPORT_EMAIL || 
        process.env.HR_EMAIL || 
        'hradmin@emyrishr.in'
    ).replace(/['"]/g, '').trim();
    return `Invalid code contact to ${email}.`;
}

// Verify Registration Access Code
router.post('/verify-access-code', (req, res) => {
    let { code } = req.body;
    code = (code || '').trim().toUpperCase();
    const errMsg = getAccessCodeErrorMessage();
    if (!code) {
        return res.status(400).json({ success: false, message: errMsg });
    }
    const allowedCodes = getAllowedAccessCodes();
    console.log(`[HR Access Code Check] Submitted: "${code}" | Configured in ENV:`, allowedCodes);

    if (allowedCodes.includes(code)) {
        return res.json({ success: true, message: 'Access code verified successfully.' });
    } else {
        return res.status(400).json({ success: false, message: errMsg });
    }
});

// Alias for React frontend - directly calls same handler as /register-applicant
router.post('/applicant/register', (req, res) => {
    return handleRegister(req, res);
});

async function handleRegister(req, res) {
    let { title, fullName, email, phone, division, designation, accessCode } = req.body;
    accessCode = (accessCode || '').trim().toUpperCase();
    const errMsg = getAccessCodeErrorMessage();
    
    // Verify Access Code
    const allowedCodes = getAllowedAccessCodes();
    if (!accessCode || !allowedCodes.includes(accessCode)) {
        return res.status(400).json({ success: false, message: errMsg });
    }

    email = (email || '').trim().toLowerCase();
    let passwordPin = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        const existingEmail = await Applicant.findOne({ email });
        if (existingEmail) {
            return res.json({ success: false, isReturning: true, message: 'Welcome back! This email is already registered. Please log in with your Password PIN to continue your journey.' });
        }
        const existingPhone = await Applicant.findOne({ phone });
        if (existingPhone) {
            return res.json({ success: false, isReturning: true, message: 'Welcome back! This phone number is already registered.' });
        }

        const newApplicant = await Applicant.create({
            email, title, fullName, phone, division, designation,
            password: passwordPin, // Password PIN strictly stored in password column
            pin: null,             // Postal PIN remains null until onboarding address is submitted
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
                    <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Your Password PIN:</strong> <span style="font-size: 20px; font-weight: bold; color: #e74c3c;">${passwordPin}</span></p>
                </div>
                <p>Please keep this Password PIN secure. You will need it to log in and check your application status.</p>
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
        res.json({ success: true, applicant: syncedApplicant, pin: passwordPin });
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
            return res.json({ success: false, message: "Account doesn't exist - Apply in New Applicant Link" });
        }
        
        const passwordPin = (applicant.password && applicant.password.length === 6 ? applicant.password : null) || 
                            (applicant.pin && applicant.pin.length === 6 ? applicant.pin : null) || 
                            Math.floor(100000 + Math.random() * 900000).toString();
        
        await Applicant.findOneAndUpdate({ email }, { password: passwordPin });

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Your Login Password PIN</h2>
                <p>Dear ${applicant.title} ${applicant.fullName},</p>
                <p>As requested, here are your login details for the Applicant Portal:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>Your Email:</strong> ${email}</p>
                    <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Your Password PIN:</strong> <span style="font-size: 20px; font-weight: bold; color: #e74c3c;">${passwordPin}</span></p>
                </div>
                <p>Best regards,<br/><strong>HR Department</strong><br/>Emyris Biolifesciences</p>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: 'Your Login Password PIN - Emyris Biolifesciences',
            html: emailHtml
        });

        res.json({ success: true, message: 'Password PIN has been sent to your email.' });
    } catch (err) {
        console.error('Resend PIN error:', err);
        res.json({ success: false, message: 'System error. Please try again later.' });
    }
});

module.exports = router;
