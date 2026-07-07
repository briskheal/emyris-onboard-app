const express = require('express');
const { execSync } = require('child_process');

// --- AUTO-INSTALL DEPENDENCIES ON BOOT ---
try {
    require('sequelize');
    require('pg');
} catch (e) {
    console.log("Installing missing database packages...");
    execSync('npm install sequelize pg', { stdio: 'inherit' });
    console.log("Installation complete!");
}
// ------------------------------------------

const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, syncDatabase, Company, Applicant, Division, HQ, Asset, TemplateHistory, Question, ExamResult } = require('./db');
const fs = require('fs');
const path = require('path');

dotenv.config();
const dns = require('dns');

// Force Google DNS for SRV resolution (fixes ECONNREFUSED on some environments)
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('🌐 [DNS] Switched to Google DNS');
} catch (e) {
    console.warn('⚠️ [DNS] Failed to set custom DNS servers:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'https://emyrishr.in';



const connMain = null;
const connAssets = null;

// Try to use system DNS, but force IPv4 on connection
// Mongoose 8/Node 18+ can fail resolving IPv6 mappings on some SRV clusters.

// --- TEMPLATE ENGINE UTILITIES ---
function numberToWords(num) {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    const count = (n) => {
        if (n < 20) return a[n];
        let s = b[Math.floor(n / 10)];
        if (n % 10 > 0) s += ' ' + a[n % 10];
        return s;
    };

    if (num === 0) return 'zero';
    let words = '';
    
    if (Math.floor(num / 10000000) > 0) {
        words += count(Math.floor(num / 10000000)) + ' crore ';
        num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
        words += count(Math.floor(num / 100000)) + ' lakh ';
        num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
        words += count(Math.floor(num / 1000)) + ' thousand ';
        num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
        words += count(Math.floor(num / 100)) + ' hundred ';
        num %= 100;
    }
    if (num > 0) {
        if (words !== '') words += 'and ';
        words += count(num);
    }
    return words.trim().toLowerCase();
}

function resolveTemplate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
        const placeholder = `{{${key}}}`;
        result = result.split(placeholder).join(value || '');
    }
    // Handle special cases or nested objects if needed
    return result;
}


// Startup logic
async function initializeApp() {
    console.log('🚀 Server starting - Shared PostgreSQL Clean Slate protocol active (NO MONGODB IMPORT).');
    await syncDatabase();
    await seedData();
}

async function seedData() {
    try {
        const divCount = await Division.countDocuments();
        if (divCount === 0) {
            console.log('🌱 Seeding default divisions...');
            await Division.create([
                { name: 'SALES', active: true },
                { name: 'MARKETING', active: true },
                { name: 'OPERATIONS', active: true }
            ]);
        }
        const hqCount = await HQ.countDocuments();
        if (hqCount === 0) {
            console.log('🌱 Seeding default HQs...');
            await HQ.create([
                { name: 'DELHI', active: true },
                { name: 'MUMBAI', active: true },
                { name: 'KOLKATA', active: true },
                { name: 'CHENNAI', active: true }
            ]);
        }
    } catch (e) {
        console.error('❌ Seeding failed', e);
    }
}
initializeApp();

// Global Error Handlers (Fix for 502/Crashes)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.static(__dirname));

// Serve React assets for Admin panel
app.use('/assets', express.static(path.join(__dirname, 'frontend', 'dist', 'assets')));

// Mount modular routers
const applicantRouter = require('./routes/applicant');
const adminRouter = require('./routes/admin');
app.use('/api/applicant', applicantRouter);
app.use('/api/admin', adminRouter);

// Legacy Route Aliases for original HTML portal (script.js)
app.get('/api/company-data', (req, res, next) => {
    req.url = '/api/company-data';
    adminRouter(req, res, next);
});

app.post('/api/applicant-login', (req, res, next) => {
    req.url = '/login';
    applicantRouter(req, res, next);
});


// Local File Storage Helper
function saveBase64ToFile(email, category, base64Data) {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:')) {
        return base64Data; // Already a URL or missing
    }
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Data;
    
    let ext = 'png';
    if (matches[1].includes('pdf')) ext = 'pdf';
    else if (matches[1].includes('webp')) ext = 'webp';
    else if (matches[1].includes('jpeg') || matches[1].includes('jpg') || matches[1].includes('jfif')) ext = 'jpg';

    const safeEmail = email.replace(/[^a-z0-9]/gi, '_');
    const safeCategory = category.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeEmail}_${safeCategory}_${Date.now()}.${ext}`;
    
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    // Asynchronously save to PostgreSQL Asset database as backup against Docker volume wipes
    Asset.create({
        _id: filename,
        category: `doc_${safeCategory}`,
        name: filename,
        data: base64Data,
        active: true
    }).catch(e => console.error("Asset DB backup error:", e.message));
    return `/api/admin/uploads/${filename}`;
}

// Explicit route to bypass Nginx static file interception & support direct downloads


// ------------------------- EMAIL DELIVERY ENGINE -------------------------
// WHY BRIDGE INSTEAD OF ZOHO SMTP?
// Render.com FREE tier BLOCKS outbound SMTP ports (25, 465, 587).
// Zoho SMTP will always timeout on free Render plans.
// The Google Apps Script Bridge uses HTTPS (port 443) which is NEVER blocked.
// It delivers from hr@emyrisbio.com and is the CORRECT solution for this stack.
// -------------------------------------------------------------------------
async function sendEmail({ to, subject, html, attachments = [] }) {
    const resend = process.env.RESEND_API_KEY ? new (require('resend').Resend)(process.env.RESEND_API_KEY) : null;
    const bridgeUrl = process.env.EMAIL_BRIDGE_URL;
    const emailUser = process.env.EMAIL_USER || "hradmin@emyrishr.in";
    const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
    const isZoho = emailUser.includes('zoho') || emailUser.includes('emyrishr.in') || process.env.EMAIL_HOST;

    const host = process.env.EMAIL_HOST || (isZoho ? 'smtppro.zoho.in' : 'smtp.gmail.com');
    const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : (isZoho ? 465 : 587);
    const secure = process.env.EMAIL_SECURE !== undefined ? (process.env.EMAIL_SECURE === 'true') : (port === 465);
    const fromAddr = process.env.EMAIL_FROM || `"Emyris HR" <${emailUser}>`;

    console.log(`📡 [OUTGOING] To: ${to} | Subject: ${subject} | Via: ${host}`);

    // STRATEGY 1: SMTP Delivery (Zoho / Gmail / Custom Host)
    if (isZoho || !bridgeUrl) {
        const transporter = nodemailer.createTransport(isZoho || process.env.EMAIL_HOST ? {
            host,
            port,
            secure,
            auth: { user: emailUser, pass: emailPass }
        } : {
            service: 'gmail',
            auth: { user: emailUser, pass: emailPass }
        });

        try {
            console.log(`📧 [INFO] Attempting SMTP delivery via ${host}...`);
            const info = await transporter.sendMail({
                from: fromAddr,
                to, subject, html,
                attachments
            });
            console.log(`✅ [SUCCESS] SMTP delivery confirmed: ${info.messageId}`);
            return info;
        } catch (smtpErr) {
            console.warn(`⚠️ [WARN] SMTP delivery failed (${smtpErr.message}).`);
            if (!bridgeUrl) throw smtpErr;
            console.log('☁️ [INFO] Falling back to Google Apps Script Bridge...');
        }
    }

    // STRATEGY 2: Google Apps Script Bridge (HTTPS fallback for restricted network environments)
    if (bridgeUrl) {
        try {
            console.log('☁️ [INFO] Sending via Google Apps Script Bridge...');
            const bridgeAttachments = attachments.map(att => ({
                filename: att.filename,
                content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
                contentType: att.contentType
            }));

            const response = await axios.post(bridgeUrl, {
                to, subject, html,
                attachments: bridgeAttachments
            }, { timeout: 25000 });

            console.log(`✅ [SUCCESS] Bridge delivery confirmed: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (bridgeErr) {
            console.error(`❌ [FAILURE] Bridge failed: ${bridgeErr.message}`);
            throw bridgeErr;
        }
    }
}

// Removed duplicate save-draft endpoint. Handled below.

// Alias for React frontend - directly calls same handler as /api/register-applicant
app.post('/api/applicant/register', (req, res) => {
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
        if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already registered.' });
        await Applicant.create({ title, fullName, email, phone, division, designation, password: pin });
        console.log(`[DB] Account Created: ${email}`);
        await sendEmail({
            to: email,
            subject: 'Emyris Onboarding: Your Secure Login PIN',
            html: `<div style="font-family:'Segoe UI',Arial;padding:30px;border:1px solid #e1e1e1;border-radius:8px;color:#333"><h2 style="color:#003366">Welcome to Emyris Biolifesciences, ${fullName}!</h2><p>Your recruitment profile has been successfully generated.</p><div style="background:#f4f6f8;padding:20px;border-left:5px solid #003366;margin:20px 0"><p style="margin:0;font-size:1.1em"><strong>Your Login PIN:</strong></p><p style="font-size:2em;color:#003366;font-weight:bold;margin:10px 0">${pin}</p></div><p>Please use this PIN and your email to log in and complete your onboarding application.</p></div>`
        });
        res.status(200).json({ success: true, message: 'Registration Successful. PIN sent to inbox.', pin });
    } catch (error) {
        console.error('[REGISTRATION ERROR]:', error.message);
        res.status(200).json({ success: false, needsRecovery: true, message: 'Account created, but email delivery failed.', pin });
    }
}


app.post('/api/register-applicant', async (req, res) => {
    let { title, fullName, email, phone, division, designation } = req.body;
    email = email.trim().toLowerCase();
    let pin = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // 1. Uniqueness Guard & Recovery Detection
        const existingEmail = await Applicant.findOne({ email });
        if (existingEmail) {
            return res.json({ 
                success: false, 
                isReturning: true,
                message: 'Welcome back! This email is already registered. Please log in to continue your journey.' 
            });
        }

        const existingPhone = await Applicant.findOne({ phone });
        if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already registered.' });

        // 2. Database Persistence
        await Applicant.create({ 
            title, 
            fullName, 
            email, 
            phone, 
            division,
            designation,
            password: pin 
        });
        console.log(`≡ƒÆ╛ [DB] Account Created: ${email}`);

        // 3. Synchronous Email Handover
        await sendEmail({
            to: email,
            subject: 'Emyris Onboarding: Your Secure Login PIN',
            html: `
                <div style="font-family: 'Segoe UI', Arial; padding: 30px; border: 1px solid #e1e1e1; border-radius: 8px; color: #333;">
                    <h2 style="color: #003366;">Welcome to Emyris Biolifesciences, ${fullName}!</h2>
                    <p>Your recruitment profile has been successfully generated.</p>
                    <div style="background: #f4f6f8; padding: 20px; border-left: 5px solid #003366; margin: 20px 0;">
                        <p style="margin: 0; font-size: 1.1em;"><strong>Your Login PIN:</strong></p>
                        <p style="font-size: 2em; color: #003366; font-weight: bold; margin: 10px 0;">${pin}</p>
                    </div>
                    <p>Please use this PIN and your email to log in and complete your onboarding application.</p>
                </div>
            `
        });

        res.status(200).json({
            success: true,
            message: 'Registration Successful. PIN sent to inbox.',
            pin: pin
        });

    } catch (error) {
        console.error('≡ƒ¢æ [REGISTRATION ERROR]:', error.message);

        // --- SMART RECOVERY ---
        res.status(200).json({
            success: false,
            needsRecovery: true, // Tell frontend to show PIN
            message: 'Account created, but we had trouble delivering the email.',
            pin: pin
        });
    }
});

// HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
    const status = {
        server: 'online',
        mainDB: connMain ? (connMain.readyState === 1 ? 'connected' : 'disconnected (' + connMain.readyState + ')') : 'not initialized',
        assetDB: connAssets ? (connAssets.readyState === 1 ? 'connected' : 'disconnected (' + connAssets.readyState + ')') : 'not initialized',
        timestamp: new Date()
    };
    res.json(status);
});

// EMAIL DIAGNOSTIC ENDPOINT (Admin only - temporary debug)
app.get('/api/test-email', async (req, res) => {
    const emailUser = process.env.EMAIL_USER || 'NOT SET';
    const emailPass = process.env.EMAIL_PASS ? '✅ SET (' + process.env.EMAIL_PASS.length + ' chars)' : '❌ NOT SET';
    const emailHost = process.env.EMAIL_HOST || 'NOT SET';
    const emailPort = process.env.EMAIL_PORT || 'NOT SET';

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtppro.zoho.in',
        port: parseInt(process.env.EMAIL_PORT || '465'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: { user: emailUser, pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '') }
    });

    try {
        await transporter.verify();
        const info = await transporter.sendMail({
            from: `"Emyris HR" <${emailUser}>`,
            to: emailUser,
            subject: 'Live SMTP Test - ' + new Date().toISOString(),
            html: '<p>✅ Zoho SMTP is working correctly on the live Hostycare server!</p>'
        });
        res.json({ 
            success: true, 
            message: 'Email sent successfully!',
            messageId: info.messageId,
            config: { emailUser, emailPass, emailHost, emailPort }
        });
    } catch (e) {
        res.json({ 
            success: false, 
            error: e.message, 
            code: e.code,
            config: { emailUser, emailPass, emailHost, emailPort }
        });
    }
});


// PIN RECOVERY MODULE
app.post('/api/resend-pin', async (req, res) => {
    let { email } = req.body;
    email = email.trim().toLowerCase();
    try {
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ success: false, message: 'Email not found.' });

        await sendEmail({
            to: email,
            subject: 'Emyris Onboarding: Your Login PIN (Recovery)',
            html: `
                <div style="font-family: 'Segoe UI', Arial; padding: 30px; border: 1px solid #e1e1e1; border-radius: 8px; color: #333;">
                    <h2 style="color: #003366;">PIN Recovery</h2>
                    <p>Hello ${applicant.fullName},</p>
                    <p>As requested, here is your login PIN for the Emyris Onboarding portal.</p>
                    <div style="background: #f4f6f8; padding: 20px; border-left: 5px solid #003366; margin: 20px 0;">
                        <p style="margin: 0; font-size: 1.1em;"><strong>Your Login PIN:</strong></p>
                        <p style="font-size: 2em; color: #003366; font-weight: bold; margin: 10px 0;">${applicant.password}</p>
                    </div>
                    <p>Please use this PIN to log in and continue your application.</p>
                </div>
            `
        });

        res.status(200).json({ success: true, message: 'PIN sent to your email.' });
    } catch (error) {
        console.error('≡ƒ¢æ [RECOVERY ERROR]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to send PIN. Please contact HR.' });
    }
});

// Applicant Login


// Save Draft
app.post('/api/save-draft', async (req, res) => {
    try {
        const { email, formData } = req.body;
        console.log(`≡ƒô¥ [DRAFT] Saving for ${email} (${JSON.stringify(formData).length} bytes)`);
        const result = await Applicant.findOneAndUpdate({ email }, { formData, updatedAt: new Date() });
        if (!result) console.error(`Γ¥î [DRAFT] No applicant found for ${email}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(`≡ƒ¢æ [DRAFT ERROR]:`, error.message);
        res.status(500).json({ success: false });
    }
});

// Submit Onboarding
app.post('/api/submit-onboarding', async (req, res) => {
    try {
        const { email, formData } = req.body;

        const parseDMY = (s) => {
            if (!s || typeof s !== 'string') return null;
            if (s.includes('T')) return new Date(s); // Already ISO
            const parts = s.split('-');
            if (parts.length !== 3) return null;
            // Handle YYYY-MM-DD (Native Date Picker)
            if (parts[0].length === 4) return new Date(s);
            // Handle DD-MM-YYYY (Legacy)
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        };

        const applicant = await Applicant.findOneAndUpdate(
            { email },
            {
                formData,
                status: 'submitted',
                canLogin: true,
                submittedAt: new Date(),
                hq: formData.hq,
                actualJoiningDate: formData.joiningDate, // Store as string DD-MM-YYYY
                dob: formData.dob, // Store as string DD-MM-YYYY
                address: formData.address || "",
                pin: formData.pin || "",
                state: formData.state || "",
                salary: formData.salary || "",
                maritalStatus: formData.maritalStatus || "Unmarried",
                anniversaryDate: formData.maritalStatus === 'Married' ? `${formData.anniversaryDay}-${formData.anniversaryMonth}` : "",
                epfNumber: formData.epfNumber || "",
                uanNumber: formData.uanNumber || "",
                esiNumber: formData.esiNumber || ""
            },
            { new: true }
        );

        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Applicant session not found. Please log in again.' });
        }

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">New Onboarding Submission</h2>
                <p><strong>Applicant:</strong> ${applicant.fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <hr>
                <p>Detailed profile is now available in the Admin Portal for review and PDF download.</p>
            </div>
        `;

        // Notify Admin (Non-blocking)
        sendEmail({
            to: process.env.EMAIL_USER,
            subject: `Form Submitted: ${applicant.fullName}`,
            html: emailHtml
        }).catch(e => console.error("Admin notification failed:", e.message));

        // Notify Applicant (Non-blocking)
        sendEmail({
            to: email,
            subject: 'Application Received - Emyris Biolifesciences',
            html: `<h3>Thank you, ${applicant.fullName}!</h3><p>Your onboarding documents have been submitted successfully. Our team will review them and get back to you.</p>`
        }).catch(e => console.error("Applicant confirmation failed:", e.message));

        res.status(200).json({ success: true, message: 'Application submitted!' });
    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({ success: false, message: 'Submission failed: ' + error.message });
    }
});

// --- RAPID TEST APIs ---

// Serve React Admin Portal & Beta Portal
app.get(['/admin*', '/beta*'], (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Serve Original Applicant Portal (Catch-all)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).json({ success: false, message: 'API route not found' });
    }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
