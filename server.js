const express = require('express');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

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
    return words.toUpperCase() + ' ONLY';
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
    confirmLetterBody: String,
    revisedSalaryBody: String,
    incentiveCircularBody: String,
    miscLetters: { type: Array, default: [] },
    fyFrom: String,
    fyTo: String,
    letterFontSize: { type: Number, default: 11 },
    letterFontType: { type: String, default: 'helvetica' },
    letterAlignment: { type: String, default: 'left' },
    updatedAt: { type: Date, default: Date.now },
    headerHeight: { type: Number, default: 65 },
    footerHeight: { type: Number, default: 25 },
    marqueeText: { type: String, default: "Enhancing Life and Excelling in Care" },
    marqueeColor: { type: String, default: "#94a3b8" },
    marqueeSpeed: { type: Number, default: 20 },
    offerCounter: { type: Number, default: 1001 },
    apptCounter: { type: Number, default: 1001 },
    miscCounter: { type: Number, default: 1001 },
    empCodeCounter: { type: Number, default: 1001 },
    customAssetCategories: { type: [String], default: [] },
    designations: { 
        type: [mongoose.Schema.Types.Mixed], 
        default: [
            { title: "Territory Business Manager", department: "SALES" },
            { title: "Area Sales Manager", department: "SALES" },
            { title: "Regional Sales Manager", department: "SALES" },
            { title: "Sr. Regional Sales Manager", department: "SALES" },
            { title: "Zonal Sales Manager", department: "SALES" },
            { title: "Sr. Zonal Sales Manager", department: "SALES" },
            { title: "Sales Manager", department: "SALES" },
            { title: "National Sales Manager", department: "SALES" },
            { title: "General Manager (Sales & Mktng)", department: "SALES" }
        ] 
    },
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
    title: { type: String, default: "Mr." },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    status: { type: String, default: 'draft' },
    canLogin: { type: Boolean, default: true },
    formData: { type: Object, default: {} },
    registeredAt: { type: Date, default: Date.now },
    submittedAt: Date,
    approvedAt: Date,
    documents: { type: [mongoose.Schema.Types.Mixed], default: [] },
    division: String,
    reportingTo: String,
    hq: String,
    empCode: String,
    refNo: String,
    salaryBreakup: { type: Object, default: {} },
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
    verificationChecks: { type: Object, default: {} },
    rejectionReason: String,
    rejectedAt: Date,
    isExistingStaff: { type: Boolean, default: false }
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

const hqSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true }
});
const HQ = connMain ? connMain.model('HQ', hqSchema) : mongoose.model('HQ', hqSchema);
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
    console.log(`📡 [OUTGOING] To: ${to} | Subject: ${subject}`);

    // STRATEGY 1: Google Apps Script Bridge (HTTPS - The only way to send on Render Free)
    if (bridgeUrl) {
        try {
            console.log('☁️ [INFO] Sending via Google Apps Script Bridge...');

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
        console.log('📧 [INFO] Attempting Gmail SMTP (local mode)...');
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
    const { title, fullName, email, phone, division, designation } = req.body;
    let pin = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // 1. Uniqueness Guard
        const existingEmail = await Applicant.findOne({ email });
        if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered.' });

        const existingPhone = await Applicant.findOne({ phone });
        if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already registered.' });

        // 2. Database Persistence
        await Applicant.create({ 
            title, 
            fullName, 
            email, 
            phone, 
            division,
            formData: { designation }, // Store pre-selected designation in formData
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
        console.error('≡ƒ¢æ [RECOVERY ERROR]:', error.message);
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
                formData: applicant.formData,
                documents: applicant.documents || [],
                verificationChecks: applicant.verificationChecks || {},
                salaryBreakup: applicant.salaryBreakup || {},
                tasks: applicant.tasks || {},
                division: applicant.division,
                reportingTo: applicant.reportingTo,
                hq: applicant.hq,
                refNo: applicant.refNo,
                actualJoiningDate: applicant.actualJoiningDate,
                offerAccepted: applicant.offerAccepted,
                offerLetterData: applicant.offerLetterData,
                apptLetterData: applicant.apptLetterData
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

        const sizeKB = Math.round(Buffer.byteLength(fileData || '', 'utf8') / 1024);
        console.log(`≡ƒôÄ [DOC-UPLOAD] ${email} | ${category} | ${fileName} | ${sizeKB}KB`);

        if (sizeKB > 12 * 1024) { // Increased to 12MB as it's now in Asset DB
            return res.status(413).json({ success: false, message: `File too large (${sizeKB}KB). Maximum 12MB allowed.` });
        }

        const applicant = await Applicant.findOne({ email });
        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        // 1. Store in Asset Collection (Asset DB)
        const newAsset = new Asset({
            category: `doc_${category}`,
            name: fileName,
            data: fileData,
            active: true,
            uploadedAt: new Date()
        });
        const savedAsset = await newAsset.save();

        // 2. Link metadata in Applicant (WITHOUT the heavy data)
        const docMetadata = {
            category,
            name: fileName,
            assetId: savedAsset._id,
            sizeKB,
            uploadedAt: new Date()
        };

        // Use atomic update to prevent race conditions during concurrent uploads
        await Applicant.updateOne(
            { email },
            { 
                $pull: { documents: { category: category } }
            }
        );
        
        await Applicant.updateOne(
            { email },
            { 
                $push: { documents: docMetadata }
            }
        );

        console.log(`Γ£à [DOC] Atomic Upload: ${category} for ${email} (Asset: ${savedAsset._id})`);

        res.status(200).json({ 
            success: true, 
            message: `${category} uploaded successfully`,
            assetId: savedAsset._id 
        });
    } catch (error) {
        console.error('Γ¥î Document upload error:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

// --- ADMIN APIs ---

app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = (process.env.ADMIN_USER || 'EMYRIS@BIOLIFE').toUpperCase();
    const adminPass = process.env.ADMIN_PASS || 'Omrutam@1306';

    if (username && username.toUpperCase() === adminUser && password === adminPass) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.get('/api/admin/applicant-pin/:email', async (req, res) => {
    try {
        const applicant = await Applicant.findOne({ email: req.params.email }).select('fullName email password status');
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
        res.json({ name: applicant.fullName, email: applicant.email, pin: applicant.password, status: applicant.status });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// FAST-TRACK EXISTING STAFF API
app.post('/api/admin/add-existing-staff', async (req, res) => {
    try {
        const { fullName, email, phone, empCode, designation, targetSalary, division, hq, joinDate, dob, address } = req.body;

        // Validation
        if (!fullName || !email || !phone) {
            return res.status(400).json({ success: false, message: 'Name, Email, and Phone are required.' });
        }

        const existingEmail = await Applicant.findOne({ email });
        if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered.' });

        const formattedSalary = parseFloat(targetSalary) || 0;

        // Auto-calculate standard salary breakup if salary is provided
        let salaryBreakup = {};
        if (formattedSalary > 0) {
            const monthly = parseFloat((formattedSalary / 12).toFixed(2));
            const basic = parseFloat((monthly * 0.40).toFixed(2));
            const hra = parseFloat((basic * 0.40).toFixed(2));
            const edu = 200.00;
            const conveyance = 3000.00;
            const medical = 1250.00; // Fixed per requirement
            
            const ltaBase = monthly - (basic + hra);
            const lta = parseFloat((ltaBase * 0.07).toFixed(2));
            
            const used = parseFloat((basic + hra + lta + edu + conveyance + medical).toFixed(2));
            const special = parseFloat((monthly - used).toFixed(2));
            
            salaryBreakup = {
                v_salBasic: basic.toFixed(2),
                v_salHra: hra.toFixed(2),
                v_salLta: lta.toFixed(2),
                v_salConv: conveyance.toFixed(2),
                v_salMed: medical.toFixed(2),
                v_salEdu: edu.toFixed(2),
                v_salFixed: "0.00",
                v_salSpecial: special.toFixed(2)
            };
        }

        // Construct the fast-tracked profile directly into 'approved' state
        const newStaff = new Applicant({
            fullName,
            email,
            phone,
            password: 'EXISTING_STAFF_NO_PIN', // Doesn't need a real PIN as they don't log in
            status: 'approved', // Bypass draft/submitted/verification
            isExistingStaff: true, // Custom flag to hide offer logic
            canLogin: false, // Prevents them from needing the portal
            approvedAt: new Date(),
            division: division || 'General',
            hq: hq || 'Unassigned',
            empCode: empCode || '',
            actualJoiningDate: joinDate ? new Date(joinDate) : new Date(),
            formData: {
                designation: designation || 'Employee',
                salary: formattedSalary.toString(),
                dob: dob || '',
                current_address: address || '',
                first_name: fullName.split(' ')[0],
                last_name: fullName.split(' ').slice(1).join(' ') || ''
            },
            salaryBreakup: salaryBreakup,
            tasks: {
                offerLetter: true, // Auto-mark as done
                appointmentLetter: false,
                appLinkSent: false,
                loginDetailsSent: false
            }
        });

        await newStaff.save();
        console.log(`Γ£à [FAST-TRACK] Added existing staff member: ${email} (${fullName})`);
        res.status(200).json({ success: true, message: 'Existing staff added successfully.' });

    } catch (error) {
        console.error('Fast-track error:', error);
        res.status(500).json({ success: false, message: 'Failed to add existing staff.' });
    }
});

app.get('/api/admin/applicants', async (req, res) => {
    try {
        // Optimization: Exclude Large Document Data from the Main List
        const applicants = await Applicant.find()
            .select('-documents.data') // Strip any legacy embedded data
            .sort({ registeredAt: -1 });
        
        res.status(200).json(applicants);
    } catch (error) {
        console.error("List Fetch Error:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

// New Endpoint for Lazy Loading Document Data
app.get('/api/admin/document/:assetId', async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.assetId);
        if (!asset) return res.status(404).json({ error: 'Document data not found' });
        res.json({ data: asset.data });
    } catch (e) {
        res.status(500).json({ error: 'Fetch failed' });
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
            update.rejectedAt = new Date();
            update.rejectionReason = req.body.reason || "Application not accepted.";
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

app.post('/api/admin/reject-document', async (req, res) => {
    try {
        const { email, docCategory, reason } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        // Unlock login so they can fix it
        applicant.canLogin = true;
        // Optionally mark the specific doc as rejected in verificationChecks
        if (!applicant.verificationChecks) applicant.verificationChecks = {};
        applicant.verificationChecks[docCategory] = 'rejected';
        applicant.markModified('verificationChecks');
        await applicant.save();

        // Notify Applicant
        await sendEmail({
            to: email,
            subject: `Action Required: Document Verification for Emyris Onboarding`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #fee2e2; border-radius: 12px; background: #fffcfc;">
                    <h3 style="color: #b91c1c;">Hi ${applicant.fullName},</h3>
                    <p>During our review, we found an issue with your <strong>${docCategory}</strong>.</p>
                    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0;">
                        <p style="margin: 0; color: #991b1b;"><strong>Reason for Rejection:</strong><br>${reason || 'The document was either unclear, incorrect, or expired.'}</p>
                    </div>
                    <p>Your portal has been <strong>unlocked</strong>. Please log in using your registered email and PIN to re-upload the correct document.</p>
                    <a href="https://emyris-onboard-app.onrender.com" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Login to Portal</a>
                </div>
            `
        });

        res.json({ success: true, message: 'Rejection email sent and login unlocked.' });
    } catch (e) {
        console.error('Reject Error:', e);
        res.status(500).json({ error: 'Failed to process rejection' });
    }
});

// --- DIVISION APIs ---
app.get('/api/admin/divisions', async (req, res) => {
    try {
        const divisions = await Division.find({ active: true }).sort({ name: 1 });
        res.json(divisions);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/admin/hqs', async (req, res) => {
    try {
        const hqs = await HQ.find({ active: true }).sort({ name: 1 });
        res.json(hqs);
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
        if (!name) return res.status(400).json({ error: 'Name required' });
        
        const cleanName = name.toUpperCase().trim();
        // Strict duplicate check across ALL records (including inactive ones)
        const existing = await Division.findOne({ name: cleanName });
        
        if (existing) {
            existing.active = true;
            await existing.save();
        } else {
            await Division.create({ name: cleanName });
        }
        res.json({ success: true });
    } catch (e) { 
        console.error("Division add error:", e);
        res.status(500).json({ error: 'Failed' }); 
    }
});

app.post('/api/admin/hqs', async (req, res) => {
    try {
        const { name } = req.body;
        const existing = await HQ.findOne({ name: name.toUpperCase().trim() });
        if (existing) {
            existing.active = true;
            await existing.save();
        } else {
            await HQ.create({ name: name.toUpperCase().trim() });
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

app.delete('/api/admin/hqs/:id', async (req, res) => {
    try {
        await HQ.findByIdAndUpdate(req.params.id, { active: false });
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
        let prefix = "EMY/OFR";

        if (type === 'appt') {
            counterKey = 'apptCounter';
            prefix = "EMY/APT";
        } else if (type === 'misc' || (type && type.startsWith('misc_'))) {
            counterKey = 'miscCounter';
            prefix = "EMY/MISC";
        } else if (type === 'empcode') {
            counterKey = 'empCodeCounter';
            prefix = "EMY/EMPC";
        }

        const counter = company[counterKey] || 1001;
        const fyFrom = company.fyFrom ? new Date(company.fyFrom) : new Date();
        const fyTo = company.fyTo ? new Date(company.fyTo) : new Date();
        const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;

        const refNo = `${prefix}/${counter}/${fyShort}`;

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

app.post('/api/admin/render-template', async (req, res) => {
    try {
        const { email, type, customBody } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne();
        
        if (!applicant || !company) return res.status(404).json({ error: 'Data missing' });

        let template = customBody || (type === 'offer' ? company.offerLetterBody : company.apptLetterBody);
        
        const fd = applicant.formData || {};
        const sal = applicant.salaryBreakup || {};
        
        // Calculate Total
        const monthlyTotal = Object.values(sal).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        const annualCTC = monthlyTotal * 12;

        const map = {
            'FULL_NAME': applicant.fullName.toUpperCase(),
            'FIRST_NAME': applicant.fullName.split(' ')[0],
            'TITLE': ((fd.gender||'').toLowerCase() === 'female' ? 'Ms.' : 'Mr.'),
            'TITLE_SHORT': ((fd.gender||'').toLowerCase() === 'female' ? 'Ms.' : 'Mr.'),
            'PHONE': applicant.phone,
            'ADDRESS': fd.address || '',
            'CITY_STATE': `${fd.city || ''}, ${fd.state || ''}`,
            'PIN': fd.pin || '',
            'DESIGNATION': applicant.designation || fd.designation || '',
            'DIVISION': applicant.division || '',
            'HQ': applicant.hq || fd.hq || '',
            'JOINING_DATE': fd.joiningDate ? new Date(fd.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
            'REPORTING_TO': applicant.reportingTo || '',
            'SALARY_MONTHLY': monthlyTotal.toLocaleString('en-IN'),
            'SALARY_ANNUAL': annualCTC.toLocaleString('en-IN'),
            'SALARY_WORDS': numberToWords(annualCTC),
            'COMPANY_NAME': company.name,
            'SIGNATORY_NAME': company.signatoryName || '',
            'SIGNATORY_DESG': company.signatoryDesignation || '',
            'REF_NO': applicant.refNo || `${type === 'appt' ? 'EMY/APT' : 'EMY/OFR'}/${(type === 'appt' ? company.apptCounter : company.offerCounter) || 1001}/${String(new Date(company.fyFrom || Date.now()).getFullYear()).slice(2)}-${String(new Date(company.fyTo || Date.now()).getFullYear()).slice(2)}`,
            'TODAY_DATE': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            'EMP_CODE': applicant.formData?.empCode || 'TBD'
        };

        const resolved = resolveTemplate(template, map);
        res.json({ success: true, resolved });
    } catch (e) {
        res.status(500).json({ error: 'Render failed' });
    }
});

// --- HELPERS ---
function calculateMonthlyGross(sal) {
    if (!sal) return 0;
    return (Number(sal.basic)||0) + (Number(sal.hra)||0) + (Number(sal.lta)||0) + (Number(sal.conveyance)||0) + (Number(sal.medical)||0) + (Number(sal.special)||0) + (Number(sal.edu)||0) + (Number(sal.fixed)||0);
}

// --- UPDATE APPLICANT WORKFLOW DATA ---
app.post('/api/admin/update-workflow-data', async (req, res) => {
    try {
        const { email, division, reportingTo, hq, empCode, refNo, salaryBreakup, verificationChecks } = req.body;
        const update = {};
        if (division !== undefined) update.division = division;
        if (reportingTo !== undefined) update.reportingTo = reportingTo;
        if (hq !== undefined) update.hq = hq;
        if (empCode !== undefined) update.empCode = empCode;
        if (refNo !== undefined) update.refNo = refNo;
        if (verificationChecks !== undefined) update.verificationChecks = verificationChecks;
        if (salaryBreakup !== undefined) {
            // Enhanced Validation: Ensure components are numeric and Basic is present
            const s = salaryBreakup;
            const components = ['basic', 'hra', 'lta', 'conveyance', 'medical', 'special', 'edu', 'fixed'];
            
            for (const key of components) {
                if (s[key] !== undefined && (isNaN(Number(s[key])) || Number(s[key]) < 0)) {
                    return res.status(400).json({ error: `Invalid value for salary component: ${key}. Must be a non-negative number.` });
                }
            }

            const monthlyGross = calculateMonthlyGross(s);
            if (monthlyGross <= 0) {
                return res.status(400).json({ error: 'Monthly Gross cannot be zero. Please check the salary breakdown.' });
            }
            if (!s.basic || Number(s.basic) <= 0) {
                return res.status(400).json({ error: 'Basic salary component is mandatory and must be greater than zero.' });
            }

            update.salaryBreakup = s;
        }
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

        // SUGGESTED DEVELOPMENT: Ensure salary and assignment are set before activation
        const gross = calculateMonthlyGross(applicant.salaryBreakup);
        if (gross <= 0 || !applicant.division || !applicant.reportingTo) {
            return res.status(400).json({ error: 'Incomplete Assignment. Please set Division, Reporting Manager and Salary Breakup before activating.' });
        }

        applicant.status = 'approved';
        applicant.approvedAt = new Date();
        applicant.verificationChecks = verificationChecks;
        applicant.canLogin = true; // Automatically grant access upon verification/activation
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
            subject: `${letterLabel} ΓÇô ${company.name}`,
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
        const update = { canLogin: true }; // Automatically ensure access when a letter is pushed to hub
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

        // 2. Notify Admin
        await sendEmail({
            to: (process.env.ADMIN_USER || 'hr@emyrisbio.com').toLowerCase(),
            subject: `🔥 Offer Accepted: ${applicant.fullName}`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:30px;line-height:1.6;color:#334155;">
                    <h2 style="color:#10b981">Great News! Offer Accepted</h2>
                    <p>Applicant <strong>${applicant.fullName}</strong> has officially accepted their Offer of Employment.</p>
                    <p><strong>Actual Date of Joining (ADOJ):</strong> ${new Date(actualJoiningDate).toDateString()}</p>
                    <p>You can now proceed with their <strong>Appointment Order</strong> issuance logic.</p>
                    <br>
                    <p>---<br>Emyris Onboard automated notification</p>
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
            // Creation will apply all schema defaults
            const newCompany = await Company.create({ name: "EMYRIS BIOLIFESCIENCES PVT LTD." });
            profile = newCompany.toObject();
        }

        // Safety: Ensure fields with defaults are present if the document was created before they were added to schema
        if (!profile.designations || profile.designations.length === 0) {
            profile.designations = [
                { title: "Territory Business Manager", department: "SALES" },
                { title: "Area Sales Manager", department: "SALES" },
                { title: "Regional Sales Manager", department: "SALES" },
                { title: "Sr. Regional Sales Manager", department: "SALES" },
                { title: "Zonal Sales Manager", department: "SALES" },
                { title: "Sr. Zonal Sales Manager", department: "SALES" },
                { title: "Sales Manager", department: "SALES" },
                { title: "National Sales Manager", department: "SALES" },
                { title: "General Manager (Sales & Mktng)", department: "SALES" }
            ];
        }
        if (!profile.requiredDocs || profile.requiredDocs.length === 0) {
            profile.requiredDocs = [
                "Aadhar Card", "PAN Card", "Educational Certificates",
                "Experience Certificate", "Previous Company Appointment Letter", "Last Three Months Pay Slip"
            ];
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

// Applicant-facing unified company data (Hydrated with Divisions and HQs)
app.get('/api/company-data', async (req, res) => {
    try {
        const company = await Company.findOne().lean();
        if (!company) return res.status(404).json({ error: 'Not found' });

        const rawDivisions = await Division.find({ active: true }).lean();
        const hqs = await HQ.find({ active: true }).lean(); // Default sort

        // Custom Sort: Move 'SALES' to top, keep others in insertion order
        const salesDiv = rawDivisions.find(d => d.name === 'SALES');
        const otherDivs = rawDivisions.filter(d => d.name !== 'SALES');
        const divisions = salesDiv ? [salesDiv, ...otherDivs] : otherDivs;

        // Enrich divisions with their respective designations from company profile
        const enrichedDivisions = divisions.map(div => {
            const desgs = (company.designations || []).filter(d => {
                const dept = (typeof d === 'object' ? d.department : 'SALES') || 'SALES';
                return dept.toUpperCase().trim() === div.name.toUpperCase().trim();
            });
            return {
                ...div,
                designations: desgs
            };
        });

        const data = {
            ...company,
            divisions: enrichedDivisions,
            hqs: hqs,
            logo: "" // Logo logic handled by asset hydration if needed
        };

        // Hydrate logo
        if (company.activeLogoId) {
            const asset = await Asset.findById(company.activeLogoId).lean();
            if (asset) data.logo = asset.data;
        }

        res.json(data);
    } catch (e) {
        console.error("Company data fetch error:", e);
        res.status(500).json({ error: 'Failed to fetch unified data' });
    }
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
        const { includeSetup } = req.body;
        
        await Applicant.deleteMany({});
        // CASCADING DELETE: Remove all applicant documents from Asset DB
        if (connAssets) {
            await Asset.deleteMany({ category: { $regex: /^doc_/ } });
        }
        
        if (includeSetup) {
            console.log("🧹 Total Wipeout: Clearing Divisions and HQs...");
            await Division.deleteMany({});
            await HQ.deleteMany({});
        }
        
        const company = await Company.findOne();
        if (company) {
            company.offerCounter = 1001;
            company.apptCounter = 1001;
            company.miscCounter = 1001;
            company.empCodeCounter = 1001;
            await company.save();
        }
        res.json({ success: true, message: 'Database cleared. ' + (includeSetup ? 'Divisions and HQs were also removed.' : '') });
    } catch (e) { 
        console.error("Nuke failed:", e);
        res.status(500).json({ error: 'Clear failed' }); 
    }
});

app.post('/api/admin/delete-applicant', async (req, res) => {
    try {
        const { email } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        // Collect all assets linked to this applicant
        const assetIds = (applicant.documents || [])
            .filter(d => d.assetId)
            .map(d => d.assetId);

        // 1. Delete Assets from Assets DB
        if (assetIds.length > 0 && connAssets) {
            await Asset.deleteMany({ _id: { $in: assetIds } });
        }

        // 2. Delete Applicant from Main DB
        await Applicant.deleteOne({ email });

        res.json({ success: true, message: `Applicant ${email} and all linked assets deleted.` });
    } catch (e) {
        console.error('Delete error:', e);
        res.status(500).json({ error: 'Failed' });
    }
});

// --- APPLICANT DATA MANAGEMENT ---
app.post('/api/applicant/delete-document', async (req, res) => {
    try {
        const { email, assetId, category } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Not found' });

        // 1. Remove from Document Array
        applicant.documents = applicant.documents.filter(d => 
            d.assetId.toString() !== assetId
        );

        // 2. Delete from Asset DB
        if (connAssets) {
            await Asset.findByIdAndDelete(assetId);
        }

        // 3. Reset verification for this category if it was the last file? 
        // Or just reset always to be safe.
        if (applicant.verificationChecks && applicant.verificationChecks[category]) {
            delete applicant.verificationChecks[category];
            applicant.markModified('verificationChecks');
        }

        await applicant.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
});

app.post('/api/admin/system/vacuum', async (req, res) => {
    try {
        if (!connAssets) return res.status(503).json({ error: 'Asset database not connected' });

        const company = await Company.findOne();
        const applicants = await Applicant.find();

        // 1. Collect all "In-Use" Asset IDs
        const inUseIds = new Set();
        
        // From Company Branding
        if (company) {
            ['activeLogoId', 'activeStampId', 'activeSignatureId', 'activeLetterheadId'].forEach(key => {
                if (company[key]) inUseIds.add(company[key]);
            });
        }

        // From Applicant Documents
        applicants.forEach(app => {
            if (app.documents) {
                app.documents.forEach(doc => {
                    if (doc.assetId) inUseIds.add(doc.assetId.toString());
                });
            }
        });

        // 2. Delete Assets that are NOT in the inUse list
        // Note: Only target categories that are "managed" (branding or applicant docs)
        // to avoid accidental deletion of other potential data.
        const result = await Asset.deleteMany({
            _id: { $nin: Array.from(inUseIds) }
        });

        res.json({ 
            success: true, 
            message: `Vacuum complete. Pruned ${result.deletedCount} unused assets.`,
            stats: { pruned: result.deletedCount, kept: inUseIds.size }
        });
    } catch (e) { 
        console.error('Vacuum failure:', e);
        res.status(500).json({ error: 'Vacuum failed' }); 
    }
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
            console.log('Γ£à Asset migration completed.');
        }
    } catch (e) {
        console.error('Migration error:', e);
    }
}

app.get('/api/admin/applicants/:email', async (req, res) => {
    try {
        const applicant = await Applicant.findOne({ email: req.params.email });
        if (!applicant) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, applicant });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/applicant/resubmit-document', async (req, res) => {
    try {
        const { email, category, data, name } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        // Remove old document of same category
        applicant.documents = applicant.documents.filter(d => d.category !== category);
        // Add new
        applicant.documents.push({ category, data, name, uploadedAt: new Date() });
        // Reset verification status
        if (applicant.verificationChecks) {
            delete applicant.verificationChecks[category];
            applicant.markModified('verificationChecks');
        }
        
        await applicant.save();
        res.json({ success: true, message: 'Document resubmitted successfully.' });
    } catch (e) {
        console.error('Resubmit error:', e);
        res.status(500).json({ error: 'Resubmission failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
