const express = require('express');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Try to use system DNS, but force IPv4 on connection
// Mongoose 8/Node 18+ can fail resolving IPv6 mappings on some SRV clusters.
// Removed forced DNS to avoid ISP blocks.

// MongoDB Connection Strings
const MONGODB_URI = process.env.MONGODB_URI;
// Fallback to same cluster but different DB if ASSET_URI isn't provided
const MONGODB_ASSETS_URI = process.env.MONGODB_ASSETS_URI || (MONGODB_URI ? MONGODB_URI.split('?')[0] + '_assets?' + (MONGODB_URI.split('?')[1] || '') : null);

let connMain, connAssets;

const dbOptions = { 
    family: 4,               // Force IPv4
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 10000 
};

if (MONGODB_URI) {
    connMain = mongoose.createConnection(MONGODB_URI, dbOptions);
    connAssets = mongoose.createConnection(MONGODB_ASSETS_URI, dbOptions);

    connMain.on('connected', () => console.log('✅ Main DB Connected'));
    connAssets.on('connected', () => console.log('💎 Asset DB Connected'));
} else {
    console.warn('MONGODB_URI not found. Running in ephemeral mode.');
}

// Schemas & Models
const companySchema = new mongoose.Schema({
    name: { type: String, default: "" },
    address: String,
    phone: String,
    tollFree: String,
    website: String,
    // Latest active IDs (pointers)
    activeLogoId: String,
    activeStampId: String,
    activeSignatureId: String,
    activeLetterheadId: String,
    signatoryName: String,
    signatoryDesignation: String,
    offerLetterBody: { type: String, default: `{{REF_NO}}\nDate: {{TODAY_DATE}}\n\nTo,\n{{TITLE_SHORT}} {{FULL_NAME}}\n{{ADDRESS}}\n{{CITY_STATE}} - {{PIN}}\n\nSubject: Offer of Employment\n\nDear {{TITLE_SHORT}} {{FULL_NAME}},\n\nWith reference to your application and subsequent interview you had with us, we are pleased to appoint you as {{DESIGNATION}} in our organization {{COMPANY_NAME}} on the following terms and conditions:\n\n1. DATE OF JOINING: Your date of joining will be {{JOINING_DATE}}.\n\n2. HEADQUARTER: Your headquarter will be {{HQ}}.\n\n3. REPORTING: You will report to {{REPORTING_TO}} or anyone else as decided by the management.\n\n4. REMUNERATION: Your monthly gross salary will be Rs. {{SALARY_MONTHLY}}/- totaling an Annual CTC of Rs. {{SALARY_ANNUAL}}/- ({{SALARY_WORDS}}).\n\nWe look forward to a long and mutually beneficial association.\n\nBest Regards,\n\n{{SIGNATORY_NAME}}\n{{SIGNATORY_DESG}}\n{{COMPANY_NAME}}` },
    apptLetterBody: String,
    miscLetters: { type: Array, default: [] },
    fyFrom: String,
    fyTo: String,
    letterFontSize: { type: Number, default: 11 },
    letterFontType: { type: String, default: 'helvetica' },
    letterAlignment: { type: String, default: 'left' },
    updatedAt: { type: Date, default: Date.now },
    headerHeight: { type: Number, default: 65 },
    footerHeight: { type: Number, default: 25 },
    offerCounter: { type: Number, default: 1001 },
    apptCounter: { type: Number, default: 1001 },
    miscCounter: { type: Number, default: 1001 },
    customAssetCategories: { type: [String], default: [] },
    requiredDocs: {
        type: [String], default: [
            "Aadhar Card",
            "PAN Card",
            "Educational Certificates",
            "Experience Certificate",
            "Previous Company Appointment Letter",
            "Last Three Months Pay Slip"
        ]
    }
});

const assetSchema = new mongoose.Schema({
    category: String, // 'logo', 'stamp', 'signature', 'letterhead'
    name: String,
    data: String,    // Base64 logic
    active: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now }
});

const applicantSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    status: { type: String, default: 'draft' },
    canLogin: { type: Boolean, default: true },
    formData: { type: Object, default: {} },
    registeredAt: { type: Date, default: Date.now },
    submittedAt: Date,
    approvedAt: Date,
    documents: [Object],
    division: String,
    reportingTo: String,
    refNo: String,
    actualJoiningDate: Date,
    offerAccepted: { type: Boolean, default: false },
    offerAcceptedAt: Date,
    offerLetterData: String, // Stores the snapshot of the generated letter
    apptLetterData: String,  // Stores the snapshot of the appt letter
    probationReminderSent: { type: Boolean, default: false },
    tasks: {
        offerLetter: { type: Boolean, default: false },
        appointmentLetter: { type: Boolean, default: false },
        appLinkSent: { type: Boolean, default: false },
        loginDetailsSent: { type: Boolean, default: false }
    },
    verificationChecks: { type: Object, default: {} }
});

const divisionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Bind models to connections
const Company = connMain ? connMain.model('Company', companySchema) : mongoose.model('Company', companySchema);
const Applicant = connMain ? connMain.model('Applicant', applicantSchema) : mongoose.model('Applicant', applicantSchema);
const Division = connMain ? connMain.model('Division', divisionSchema) : mongoose.model('Division', divisionSchema);
const Asset = connAssets ? connAssets.model('Asset', assetSchema) : mongoose.model('Asset', assetSchema);

// Startup logic
async function initializeApp() {
    console.log('🚀 Server starting - Clean Slate protocol active.');
}
if (connMain) connMain.once('open', initializeApp);
else initializeApp();

// Global Error Handlers (Fix for 502/Crashes)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Higher limit for Base64 documents
app.use(express.static(__dirname));

// ─── EMAIL DELIVERY ENGINE ───────────────────────────────────────────────────
// WHY BRIDGE INSTEAD OF ZOHO SMTP?
// Render.com FREE tier BLOCKS outbound SMTP ports (25, 465, 587).
// Zoho SMTP will always timeout on free Render plans.
// The Google Apps Script Bridge uses HTTPS (port 443) which is NEVER blocked.
// It delivers from hr@emyrisbio.com and is the CORRECT solution for this stack.
// ─────────────────────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, attachments = [] }) {
    const resend = process.env.RESEND_API_KEY ? new (require('resend').Resend)(process.env.RESEND_API_KEY) : null;
    const bridgeUrl = process.env.EMAIL_BRIDGE_URL;
    console.log(`📡 [OUTGOING] To: ${to} | Subject: ${subject}`);

    // STRATEGY 1: Google Apps Script Bridge (HTTPS - The only way to send on Render Free)
    if (bridgeUrl) {
        try {
            console.log('🌉 [INFO] Sending via Google Apps Script Bridge...');

            // Convert Buffer attachments to base64 strings for the bridge
            const bridgeAttachments = attachments.map(att => ({
                filename: att.filename,
                content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
                contentType: att.contentType
            }));

            const response = await axios.post(bridgeUrl, {
                to, subject, html,
                attachments: bridgeAttachments
            }, { timeout: 25000 }); // Longer timeout for attachments

            console.log(`✅ [SUCCESS] Bridge delivery confirmed: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (bridgeErr) {
            console.error(`⚠️ [WARN] Bridge failed: ${bridgeErr.message}. Falling back...`);
        }
    }

    // STRATEGY 2: Local Gmail / SMTP (Only works locally, NOT on Render Free)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || "emy.onboardapp@gmail.com",
            pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, "")
        }
    });


    try {
        console.log('✉️ [INFO] Attempting Gmail SMTP (local mode)...');
        const info = await transporter.sendMail({
            from: `"Emyris HR" <emy.onboardapp@gmail.com>`,
            to, subject, html
        });
        console.log(`✅ [SUCCESS] Gmail delivery confirmed: ${info.messageId}`);
        return info;
    } catch (smtpErr) {
        console.error(`❌ [FAILURE] All email strategies exhausted: ${smtpErr.message}`);
        throw smtpErr;
    }
}

// --- APPLICANT REGISTRATION MODULE (RESTART) ---
app.post('/api/register-applicant', async (req, res) => {
    const { fullName, email, phone } = req.body;
    let pin = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // 1. Uniqueness Guard
        const existing = await Applicant.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

        // 2. Database Persistence
        await Applicant.create({ fullName, email, phone, password: pin });
        console.log(`💾 [DB] Account Created: ${email}`);

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
        console.error('🛑 [REGISTRATION ERROR]:', error.message);

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

// PIN RECOVERY MODULE
app.post('/api/resend-pin', async (req, res) => {
    const { email } = req.body;
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
        console.error('🛑 [RECOVERY ERROR]:', error.message);
        res.status(500).json({ success: false, message: 'Failed to send PIN. Please contact HR.' });
    }
});

// Applicant Login
app.post('/api/applicant-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const applicant = await Applicant.findOne({ email, password });

        if (!applicant) {
            return res.status(401).json({ success: false, message: 'Invalid Email or PIN.' });
        }

        if (!applicant.canLogin) {
            let reason = "Your application reached a non-editable state.";
            if (applicant.status === 'approved') reason = "Your application has been approved.";
            if (applicant.status === 'rejected') reason = "Your application was not accepted at this time.";
            return res.status(403).json({ success: false, message: `Access Locked: ${reason}` });
        }

        // 7-Day Auto-Lock Logic for Approved Applicants
        if (applicant.status === 'approved' && applicant.approvedAt) {
            const daysSinceApproval = (Date.now() - new Date(applicant.approvedAt)) / (1000 * 60 * 60 * 24);
            if (daysSinceApproval > 7) {
                return res.status(403).json({ success: false, message: 'Access Locked: Your approval period (7 days) has expired.' });
            }
        }

        res.status(200).json({
            success: true,
            applicant: {
                fullName: applicant.fullName,
                email: applicant.email,
                phone: applicant.phone,
                status: applicant.status,
                formData: applicant.formData
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login error.' });
    }
});

// Save Draft
app.post('/api/save-draft', async (req, res) => {
    try {
        const { email, formData } = req.body;
        console.log(`📝 [DRAFT] Saving for ${email} (${JSON.stringify(formData).length} bytes)`);
        const result = await Applicant.findOneAndUpdate({ email }, { formData, updatedAt: new Date() });
        if (!result) console.error(`❌ [DRAFT] No applicant found for ${email}`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(`🛑 [DRAFT ERROR]:`, error.message);
        res.status(500).json({ success: false });
    }
});

// Submit Onboarding
app.post('/api/submit-onboarding', async (req, res) => {
    try {
        const { email, formData } = req.body;

        const applicant = await Applicant.findOneAndUpdate(
            { email },
            {
                formData,
                status: 'submitted',
                canLogin: false,
                submittedAt: new Date()
            },
            { new: true }
        );

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

// --- APPLICANT DOCUMENT UPLOAD ---
app.post('/api/applicant/upload-document', async (req, res) => {
    try {
        const { email, category, fileName, fileData } = req.body;
        if (!email || !category || !fileData) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const applicant = await Applicant.findOne({ email });
        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        // Add or update the document in the array
        const docObj = {
            category,
            name: fileName,
            data: fileData,
            uploadedAt: new Date()
        };

        // Remove previous version of this category if exists
        applicant.documents = (applicant.documents || []).filter(d => d.category !== category);
        applicant.documents.push(docObj);
        applicant.markModified('documents');

        await applicant.save();
        console.log(`📎 [DOC] Uploaded: ${category} for ${email}`);

        res.status(200).json({ success: true, message: `${category} uploaded successfully` });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
    }
});

// --- ADMIN APIs ---

app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'EMYRIS@BIOLIFE';
    const adminPass = process.env.ADMIN_PASS || 'Omrutam@1306';

    if (username === adminUser && password === adminPass) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/api/admin/applicants', async (req, res) => {
    try {
        const applicants = await Applicant.find().sort({ registeredAt: -1 });
        res.status(200).json(applicants);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/admin/toggle-access', async (req, res) => {
    try {
        const { email, canLogin } = req.body;
        await Applicant.findOneAndUpdate({ email }, { canLogin });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/admin/update-status', async (req, res) => {
    try {
        const { email, status } = req.body;
        const update = { status };
        if (status === 'approved') {
            update.canLogin = true; // Kept open after approval
            update.approvedAt = new Date(); // Start 7-day timer
        } else if (status === 'rejected') {
            update.canLogin = false;
        }
        await Applicant.findOneAndUpdate({ email }, update);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/admin/reset-applicant', async (req, res) => {
    try {
        const { email } = req.body;
        await Applicant.findOneAndUpdate(
            { email },
            {
                formData: {},
                status: 'draft',
                canLogin: true,
                approvedAt: null, // Reset approval timer
                tasks: {
                    offerLetter: false,
                    appointmentLetter: false,
                    appLinkSent: false,
                    loginDetailsSent: false
                },
                submittedAt: null
            }
        );
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Reset failed' }); }
});

app.post('/api/admin/update-task', async (req, res) => {
    try {
        const { email, taskKey, value } = req.body;
        const update = {};
        update[`tasks.${taskKey}`] = value;
        await Applicant.findOneAndUpdate({ email }, { $set: update });
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Update failed' }); }
});

// --- DIVISION APIs ---
app.get('/api/admin/divisions', async (req, res) => {
    try {
        const divisions = await Division.find({ active: true }).sort({ name: 1 });
        res.json(divisions);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Admin - DB Statistics
app.get('/api/admin/db-stats', async (req, res) => {
    try {
        if (!connMain || !connAssets) return res.status(500).json({ success: false, message: 'DB not connected' });

        const mainStats = await connMain.db.stats();
        const assetStats = await connAssets.db.stats();

        // Atlas M0 limit is 512MB = 536,870,912 bytes
        const LIMIT = 512 * 1024 * 1024; 

        const totalUsed = mainStats.dataSize + assetStats.dataSize;
        const totalStorageUsed = mainStats.storageSize + assetStats.storageSize; // Physical disk usage

        res.json({
            success: true,
            main: {
                used: mainStats.dataSize,
                storage: mainStats.storageSize,
                objects: mainStats.objects
            },
            assets: {
                used: assetStats.dataSize,
                storage: assetStats.storageSize,
                objects: assetStats.objects
            },
            summary: {
                totalUsedBytes: totalUsed,
                totalStorageUsedBytes: totalStorageUsed,
                limitBytes: LIMIT,
                usedPercentage: ((totalStorageUsed / LIMIT) * 100).toFixed(2),
                leftPercentage: (100 - (totalStorageUsed / LIMIT) * 100).toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/toggle-access', async (req, res) => {
    try {
        const { email, canLogin } = req.body;
        await Applicant.findOneAndUpdate({ email }, { canLogin });
        res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/divisions', async (req, res) => {
    try {
        const { name } = req.body;
        const existing = await Division.findOne({ name: name.toUpperCase().trim() });
        if (existing) {
            // Reactivate if was deleted
            existing.active = true;
            await existing.save();
        } else {
            await Division.create({ name: name.toUpperCase().trim() });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/divisions/:id', async (req, res) => {
    try {
        await Division.findByIdAndUpdate(req.params.id, { active: false });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// --- AUTO REF NUMBER ---
app.post('/api/admin/next-ref', async (req, res) => {
    try {
        const company = await Company.findOne();
        if (!company) return res.status(404).json({ error: 'No company profile' });

        const { type } = req.body; // 'offer', 'appt', or 'misc'

        let counterKey = 'offerCounter'; // Default
        let prefix = "OFR";

        if (type === 'appt') {
            counterKey = 'apptCounter';
            prefix = "APT";
        } else if (type === 'misc' || (type && type.startsWith('misc_'))) {
            counterKey = 'miscCounter';
            prefix = "MSC";
        }

        const counter = company[counterKey] || 1001;
        const fyFrom = company.fyFrom ? new Date(company.fyFrom) : new Date();
        const fyTo = company.fyTo ? new Date(company.fyTo) : new Date();
        const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;

        const refNo = `REF/${prefix}/${counter}/${fyShort}`;

        const updateObj = {};
        updateObj[counterKey] = counter + 1;
        await Company.findOneAndUpdate({}, updateObj);

        res.json({ success: true, refNo, counter });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// --- TEMPLATE MANAGEMENT ---
app.post('/api/admin/save-template', async (req, res) => {
    try {
        const { type, body, fontSize, fontType, headerHeight, footerHeight, signatoryName, signatoryDesg } = req.body;

        const update = {
            letterFontSize: fontSize,
            letterFontType: fontType,
            headerHeight: headerHeight,
            footerHeight: footerHeight,
            signatoryName: signatoryName,
            signatoryDesignation: signatoryDesg,
            updatedAt: new Date()
        };

        if (type === 'offer') update.offerLetterBody = body;
        else if (type === 'appt') update.apptLetterBody = body;
        else if (type.startsWith('misc_')) {
            const id = type.split('_')[1];
            // We'll need specialized logic for misc if it's an array
            // For now let's handle offer/appt which are primary
        }

        let company = await Company.findOne();
        if (!company) company = await Company.create(update);
        else {
            Object.assign(company, update);
            await company.save();
        }

        res.json({ success: true, message: 'Template saved successfully' });
    } catch (e) {
        console.error('Save template error:', e);
        res.status(500).json({ success: false, error: 'Database save failed' });
    }
});

// --- UPDATE APPLICANT WORKFLOW DATA ---
app.post('/api/admin/update-workflow-data', async (req, res) => {
    try {
        const { email, division, reportingTo, refNo } = req.body;
        const update = {};
        if (division !== undefined) update.division = division;
        if (reportingTo !== undefined) update.reportingTo = reportingTo;
        if (refNo !== undefined) update.refNo = refNo;
        await Applicant.findOneAndUpdate({ email }, { $set: update });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// --- VERIFY AND ACTIVATE APPLICANT ---
app.post('/api/admin/verify-and-activate', async (req, res) => {
    try {
        const { email, verificationChecks } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne() || { name: 'Emyris Bio' };

        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        applicant.status = 'approved';
        applicant.approvedAt = new Date();
        applicant.verificationChecks = verificationChecks;
        await applicant.save();

        // Trigger Congratulation Message
        await sendEmail({
            to: email,
            subject: `Registration Verified - Welcome to ${company.name} 🚀`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:32px;background:#f8fafc;border-radius:12px;color:#1e293b;line-height:1.6;">
                    <h2 style="color:#6366f1;margin-top:0;">Congratulations, ${applicant.fullName}!</h2>
                    <p>We are pleased to inform you that your registration documents have been <strong>successfully verified</strong> by our HR team.</p>
                    <p>Your record is now <strong>Active</strong> in our system. You can now log in to your portal to view your onboarding milestones and track your Offer Letter status.</p>
                    <p>Our team will soon initiate the next steps including official email provisioning and mobile app access.</p>
                    <br>
                    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:20px;">
                        <p style="margin:0;font-weight:700;">HR Department</p>
                        <p style="margin:0;color:#64748b;font-size:0.9rem;">${company.name}</p>
                    </div>
                </div>`
        });

        res.json({ success: true, message: 'Record activated and mail triggered.' });
    } catch (e) {
        console.error('Activation error:', e);
        res.status(500).json({ error: 'Activation failed' });
    }
});

// --- SEND LETTER VIA EMAIL ---
app.post('/api/admin/send-letter', async (req, res) => {
    try {
        const { email, letterType, pdfBase64 } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne();
        if (!applicant || !company) return res.status(404).json({ error: 'Not found' });

        const letterLabel = letterType === 'offer' ? 'Offer Letter' : 'Appointment Letter';
        const fileName = `${letterLabel.replace(/ /g, '_')}_${applicant.fullName.replace(/ /g, '_')}.pdf`;
        const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');

        await sendEmail({
            to: email,
            subject: `${letterLabel} – ${company.name}`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:24px;">
                    <h2 style="color:#0f172a">Dear ${applicant.fullName},</h2>
                    <p>Please find your <strong>${letterLabel}</strong> attached to this email.</p>
                    <p>For any queries, please contact HR.</p>
                    <br>
                    <p><strong>${company.signatoryName || 'HR Team'}</strong><br>
                    ${company.signatoryDesignation || ''}</p>
                </div>`,
            attachments: [{ filename: fileName, content: pdfBuffer, contentType: 'application/pdf' }]
        });
        res.json({ success: true });
    } catch (e) {
        console.error('Send letter error:', e);
        res.status(500).json({ error: 'Email failed', detail: e.message });
    }
});

// --- NEW: SAVE LETTER SNAPSHOT TO PORTAL ---
app.post('/api/admin/save-letter-snapshot', async (req, res) => {
    try {
        const { email, letterType, letterData } = req.body; // letterData can be HTML/Text or Base64
        const update = {};
        if (letterType === 'offer') update.offerLetterData = letterData;
        else if (letterType === 'appt') update.apptLetterData = letterData;

        await Applicant.findOneAndUpdate({ email }, { $set: update });
        res.json({ success: true, message: `Letter saved to applicant hub.` });
    } catch (e) { res.status(500).json({ error: 'Save failed' }); }
});

// --- NEW: APPLICANT ACCEPT OFFER ---
app.post('/api/applicant/accept-offer', async (req, res) => {
    try {
        const { email, actualJoiningDate } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne() || { name: 'Company' };
        if (!applicant) return res.status(404).json({ error: 'Not found' });

        applicant.offerAccepted = true;
        applicant.offerAcceptedAt = new Date();
        applicant.actualJoiningDate = new Date(actualJoiningDate);
        await applicant.save();

        // 1. Congratulate Applicant
        await sendEmail({
            to: email,
            subject: `Congratulations on Joining ${company.name}! 🚀`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:30px;line-height:1.6;color:#334155;">
                    <h2 style="color:#6366f1">Welcome Aboard, ${applicant.fullName}!</h2>
                    <p>We are thrilled to officially welcome you to <strong>${company.name}</strong>.</p>
                    <p>Your acceptance of the Offer of Employment has been recorded. Your confirmed <strong>Actual Date of Joining (ADOJ)</strong> is: <strong>${new Date(actualJoiningDate).toDateString()}</strong>.</p>
                    <p>Your official Appointment Order and further orientation details will be shared within 30 days of your joining.</p>
                    <br>
                    <p>Best Regards,</p>
                    <p><strong>Team HR</strong><br>${company.name}</p>
                </div>`
        });

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Acceptance failed' }); }
});

// --- NEW: LIFECYCLE CHECKS (Admins can poll this or call on load) ---
app.get('/api/admin/lifecycle-check', async (req, res) => {
    try {
        const applicants = await Applicant.find({
            offerAccepted: true,
            actualJoiningDate: { $exists: true }
        });

        const alerts = [];
        const now = new Date();

        applicants.forEach(app => {
            const adoj = new Date(app.actualJoiningDate);
            const diffTime = Math.abs(now - adoj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffMonths = (now.getFullYear() - adoj.getFullYear()) * 12 + (now.getMonth() - adoj.getMonth());

            // 1. Appointment Letter Logic (Send within 30 days of joining)
            if (diffDays >= 30 && !app.apptLetterData) {
                alerts.push({
                    type: 'APPOINTMENT_PENDING',
                    email: app.email,
                    name: app.fullName,
                    days: diffDays,
                    message: `${app.fullName} has completed 30 days. Appointment Letter should be issued.`
                });
            }

            // 2. Probation to Confirmation (Review at 5th month)
            if (diffMonths >= 5 && !app.probationReminderSent) {
                alerts.push({
                    type: 'PROBATION_REVIEW',
                    email: app.email,
                    name: app.fullName,
                    months: diffMonths,
                    message: `${app.fullName} is approaching 5 months of tenure. Initiate Probation Review.`
                });
            }
        });

        res.json(alerts);
    } catch (e) { res.status(500).json({ error: 'Check failed' }); }
});

// Company Profile Fetching (With latest Assets)
app.get('/api/company-profile', async (req, res) => {
    try {
        let profile = await Company.findOne().lean();
        if (!profile) {
            profile = await Company.create({ name: "EMYRIS BIOLIFESCIENCES PVT LTD." });
        }

        // Hydrate with latest active assets from Asset DB
        const assetMap = {
            activeLogoId: 'logo',
            activeStampId: 'stamp',
            activeSignatureId: 'digitalSignature',
            activeLetterheadId: 'letterheadImage'
        };

        for (const [key, field] of Object.entries(assetMap)) {
            if (profile[key]) {
                const asset = await Asset.findById(profile[key]).lean();
                profile[field] = asset ? [asset] : [];
            } else {
                profile[field] = [];
            }
        }

        res.status(200).json(profile);
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

// Full Asset Library (Lazy-loaded)
app.get('/api/admin/asset-library', async (req, res) => {
    try {
        const assets = await Asset.find({ active: true }).sort({ uploadedAt: -1 }).lean();
        res.status(200).json(assets);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch library' }); }
});

// --- INDIVIDUAL ASSET UPLOAD (REAL-TIME) ---
app.post('/api/admin/upload-asset', async (req, res) => {
    try {
        const { category, name, data, setActive } = req.body;
        if (!category || !data) return res.status(400).json({ error: 'Missing data' });

        const asset = await Asset.create({ category, name, data });

        if (setActive) {
            const company = await Company.findOne();
            if (company) {
                const map = {
                    'logo': 'activeLogoId',
                    'stamp': 'activeStampId',
                    'digitalSignature': 'activeSignatureId',
                    'letterheadImage': 'activeLetterheadId'
                };
                const field = map[category];
                if (field) {
                    company[field] = asset._id;
                    await company.save();
                }
            }
        }
        res.json({ success: true, asset });
    } catch (e) { res.status(500).json({ error: 'Upload failed' }); }
});

// --- UPDATE COMPANY PROFILE METADATA ---
app.post('/api/company-profile', async (req, res) => {
    try {
        const updateData = req.body;
        let profile = await Company.findOne();
        if (!profile) profile = await Company.create({});

        Object.assign(profile, updateData);
        profile.updatedAt = new Date();
        await profile.save();

        res.status(200).json({ success: true, profile });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// --- DELETE ASSET ---
app.post('/api/admin/delete-asset', async (req, res) => {
    try {
        const { assetId } = req.body;
        await Asset.findByIdAndUpdate(assetId, { active: false });

        // Remove from active pointers if it was the active one
        const company = await Company.findOne();
        if (company) {
            const keys = ['activeLogoId', 'activeStampId', 'activeSignatureId', 'activeLetterheadId'];
            let changed = false;
            keys.forEach(k => {
                if (company[k] === assetId) {
                    company[k] = null;
                    changed = true;
                }
            });
            if (changed) await company.save();
        }

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
});

// --- SET ACTIVE ASSET ---
app.post('/api/admin/set-active-asset', async (req, res) => {
    try {
        const { assetId, category } = req.body;
        const company = await Company.findOne();
        if (!company) return res.status(404).json({ error: 'Company not found' });

        const map = {
            'logo': 'activeLogoId',
            'stamp': 'activeStampId',
            'digitalSignature': 'activeSignatureId',
            'letterheadImage': 'activeLetterheadId'
        };

        const field = map[category];
        if (!field) return res.status(400).json({ error: 'Invalid category' });

        company[field] = assetId;
        await company.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to set active asset' }); }
});

// --- ADD CUSTOM CATEGORY ---
app.post('/api/admin/add-category', async (req, res) => {
    try {
        const { categoryName } = req.body;
        if (!categoryName) return res.status(400).json({ error: 'Name required' });

        const company = await Company.findOne();
        if (!company) return res.status(404).json({ error: 'Company not found' });

        if (!company.customAssetCategories.includes(categoryName)) {
            company.customAssetCategories.push(categoryName);
            await company.save();
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to add category' }); }
});

app.delete('/api/admin/divisions/:id', async (req, res) => {
    try {
        await Division.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to delete division' }); }
});

app.post('/api/admin/delete-category', async (req, res) => {
    try {
        const { categoryName } = req.body;

        // Safety: Ensure category is absolutely blank before deletion
        const existingAssets = await Asset.countDocuments({ category: categoryName, active: true });
        if (existingAssets > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category "${categoryName}". It still contains ${existingAssets} asset(s). Please delete all files inside first.`
            });
        }

        const company = await Company.findOne();
        if (company) {
            company.customAssetCategories = company.customAssetCategories.filter(c => c !== categoryName);
            await company.save();
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to delete category' }); }
});

// --- SYSTEM MAINTENANCE ---
app.get('/api/admin/system/export', async (req, res) => {
    try {
        const company = await Company.findOne();
        const applicants = await Applicant.find();
        const divisions = await Division.find();
        const backup = { exportDate: new Date(), company, applicants, divisions };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=emyris_backup.json');
        res.send(JSON.stringify(backup, null, 2));
    } catch (e) { res.status(500).json({ error: 'Export failed' }); }
});

app.post('/api/admin/system/clear', async (req, res) => {
    try {
        await Applicant.deleteMany({});
        const company = await Company.findOne();
        if (company) {
            company.offerCounter = 1001;
            company.apptCounter = 1001;
            company.miscCounter = 1001;
            await company.save();
        }
        res.json({ success: true, message: 'Applicant database cleared and counters reset.' });
    } catch (e) { res.status(500).json({ error: 'Clear failed' }); }
});

app.post('/api/admin/system/vacuum', async (req, res) => {
    try {
        const profile = await Company.findOne();
        if (!profile) return res.status(404).json({ error: 'Not found' });

        const categories = ['logo', 'stamp', 'digitalSignature', 'letterheadImage', 'mobileAppTemplate', 'tadaTemplate'];
        categories.forEach(cat => {
            if (profile[cat] && profile[cat].length > 1) {
                profile[cat] = [profile[cat][profile[cat].length - 1]]; // Prune everything except latest
            }
        });

        await profile.save();
        res.json({ success: true, message: 'Asset history vacuumed successfully' });
    } catch (e) { res.status(500).json({ error: 'Vacuum failed' }); }
});

// Helper for existing data migration
async function migrateAssets() {
    try {
        const profile = await Company.findOne();
        if (!profile) return;
        const categories = ['logo', 'stamp', 'digitalSignature', 'letterheadImage', 'mobileAppTemplate', 'tadaTemplate'];
        let changed = false;
        categories.forEach(cat => {
            if (profile[cat] && profile[cat].length > 0) {
                if (typeof profile[cat][0] === 'string') {
                    profile[cat] = profile[cat].map((s, i) => ({ name: `Legacy_${i + 1}`, data: s }));
                    changed = true;
                }
            }
        });
        if (changed) {
            await profile.save();
            console.log('✅ Asset migration completed.');
        }
    } catch (e) {
        console.error('Migration error:', e);
    }
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
