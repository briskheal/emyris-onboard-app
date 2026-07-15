const express = require('express');
const compression = require('compression');
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
app.use(compression());
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'https://emyrishr.in';



const connMain = null;
const connAssets = null;

// Try to use system DNS, but force IPv4 on connection
// Mongoose 8/Node 18+ can fail resolving IPv6 mappings on some SRV clusters.

const { sendEmail } = require('./utils/mailer');
const { numberToWords, resolveTemplate } = require('./utils/templateHelpers');
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

// Serve React assets for Applicant Portal
app.use('/dist-applicant', express.static(path.join(__dirname, 'public', 'dist-applicant')));

// Mount modular routers
const applicantRouter = require('./routes/applicant');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

app.use('/api/applicant', applicantRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.all('/api/company-profile', (req, res, next) => { req.url = '/company-profile'; adminRouter(req, res, next); });

// Legacy Route Aliases for original HTML portal (script.js)
app.get('/api/company-data', (req, res, next) => {
    req.url = '/api/company-data';
    adminRouter(req, res, next);
});

app.post('/api/save-detailing-scripts', (req, res, next) => {
    req.url = '/api/save-detailing-scripts';
    adminRouter(req, res, next);
});

app.post('/api/admin-login', (req, res, next) => {
    req.url = '/login';
    adminRouter(req, res, next);
});

app.post('/api/applicant-login', (req, res, next) => {
    req.url = '/applicant-login';
    authRouter(req, res, next);
});

app.post('/api/register-applicant', (req, res, next) => {
    req.url = '/register-applicant';
    authRouter(req, res, next);
});

app.post('/api/applicant/register', (req, res, next) => {
    req.url = '/applicant/register';
    authRouter(req, res, next);
});

app.post('/api/resend-pin', (req, res, next) => {
    req.url = '/resend-pin';
    authRouter(req, res, next);
});

app.post('/api/save-draft', (req, res, next) => {
    req.url = '/save-draft';
    applicantRouter(req, res, next);
});

app.post('/api/submit-onboarding', (req, res, next) => {
    req.url = '/submit-onboarding';
    applicantRouter(req, res, next);
});


// Local File Storage Helper
const sharp = require('sharp');
async function saveBase64ToFile(email, category, base64Data) {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:')) {
        return base64Data; // Already a URL or missing
    }
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Data;
    
    const mimeType = matches[1].toLowerCase();
    let ext = 'png';
    if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg') || mimeType.includes('jfif')) ext = 'jpg';

    const safeEmail = email.replace(/[^a-z0-9]/gi, '_');
    const safeCategory = category.replace(/[^a-z0-9]/gi, '_');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    let buffer = Buffer.from(matches[2], 'base64');
    if (mimeType.startsWith('image/') && !mimeType.includes('svg') && !mimeType.includes('icon')) {
        try {
            buffer = await sharp(buffer).webp({ quality: 80, effort: 4 }).toBuffer();
            ext = 'webp';
        } catch (sharpErr) {
            console.warn('[SHARP CONVERSION WARNING] Could not convert server image to WebP, saving original:', sharpErr.message);
        }
    }

    const filename = `${safeEmail}_${safeCategory}_${Date.now()}.${ext}`;
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






// --- RAPID TEST APIs ---

// Serve Emyris Admin Portal (React SPA)
app.get(['/admin', '/admin/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Serve Emyris Applicant Portal & Admin Catch-all
app.use((req, res) => {
    if (req.url.startsWith('/api/')) {
        console.error(`[404] API route not found: ${req.method} ${req.url}`);
        res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.url}` });
    } else if (req.url.startsWith('/admin')) {
        const urlWithoutQuery = req.url.split('?')[0];
        if (urlWithoutQuery.includes('.') && !urlWithoutQuery.endsWith('.html')) {
            const filename = path.basename(urlWithoutQuery);
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                return res.sendFile(filePath);
            }
        }
        res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    } else {
        const urlWithoutQuery = req.url.split('?')[0];
        if (urlWithoutQuery.includes('.') && !urlWithoutQuery.endsWith('.html')) {
            const filename = path.basename(urlWithoutQuery);
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                return res.sendFile(filePath);
            }
        }
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

const { startCronJobs } = require('./utils/cron');
startCronJobs();
app.listen(PORT, () => console.log('Server running on port ' + PORT));
