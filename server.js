const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection Strings
const MONGODB_URI = process.env.MONGODB_URI;
// Fallback to same cluster but different DB if ASSET_URI isn't provided
const MONGODB_ASSETS_URI = process.env.MONGODB_ASSETS_URI || (MONGODB_URI ? MONGODB_URI.split('?')[0] + '_assets?' + (MONGODB_URI.split('?')[1] || '') : null);

let connMain, connAssets;

if (MONGODB_URI) {
    connMain = mongoose.createConnection(MONGODB_URI);
    connAssets = mongoose.createConnection(MONGODB_ASSETS_URI);
    
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
    fyFrom: String,
    fyTo: String,
    letterFontSize: { type: Number, default: 11 },
    letterFontType: { type: String, default: 'helvetica' },
    letterAlignment: { type: String, default: 'left' },
    updatedAt: { type: Date, default: Date.now },
    headerHeight: { type: Number, default: 65 },
    footerHeight: { type: Number, default: 25 },
    letterCounter: { type: Number, default: 1001 }
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
    tasks: {
        offerLetter: { type: Boolean, default: false },
        appointmentLetter: { type: Boolean, default: false },
        appLinkSent: { type: Boolean, default: false },
        loginDetailsSent: { type: Boolean, default: false }
    }
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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- APPLICANT APIs ---

// Register Applicant
app.post('/api/register-applicant', async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;
        
        // Check if already exists
        let applicant = await Applicant.findOne({ email });
        if (applicant) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        // Generate 6-digit PIN
        const pin = Math.floor(100000 + Math.random() * 900000).toString();

        applicant = await Applicant.create({
            fullName,
            email,
            phone,
            password: pin
        });

        // Send Welcome Email with PIN
        const mailOptions = {
            from: `"Emyris Onboarding" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to Emyris Onboarding - Your Login Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #2c3e50;">Welcome, ${fullName}!</h2>
                    <p>Your registration for the Emyris Onboarding Portal was successful.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Your Login ID (User Key):</strong> ${email}</p>
                        <p style="margin: 10px 0 0 0;"><strong>Your Security PIN:</strong> <span style="font-size: 1.2em; color: #3498db; letter-spacing: 2px;">${pin}</span></p>
                    </div>
                    <p>You can use these credentials to log in and complete your onboarding application at any time.</p>
                    <p style="font-size: 0.9em; color: #7f8c8d;">Please keep this PIN secure.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Registration successful. Check your email for PIN.' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, message: 'Registration failed.' });
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
        await Applicant.findOneAndUpdate({ email }, { formData, updatedAt: new Date() });
        res.status(200).json({ success: true });
    } catch (error) {
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

        // Notify Admin
        await transporter.sendMail({
            from: `"Emyris Hub" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `Form Submitted: ${applicant.fullName}`,
            html: emailHtml
        });

        // Notify Applicant
        await transporter.sendMail({
            from: `"Emyris Onboarding" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Application Received - Emyris Biolifesciences',
            html: `<h3>Thank you, ${applicant.fullName}!</h3><p>Your onboarding documents have been submitted successfully. Our team will review them and get back to you.</p>`
        });

        res.status(200).json({ success: true, message: 'Application submitted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Submission failed.' });
    }
});

// --- ADMIN APIs ---

app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === (process.env.ADMIN_USER || 'admin') && password === (process.env.ADMIN_PASS || 'admin123')) {
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
        const counter = company.letterCounter || 1001;
        const fyFrom = company.fyFrom ? new Date(company.fyFrom) : new Date();
        const fyTo   = company.fyTo   ? new Date(company.fyTo)   : new Date();
        const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;
        const refNo = `REF/${counter}/${fyShort}`;
        await Company.findOneAndUpdate({}, { letterCounter: counter + 1 });
        res.json({ success: true, refNo, counter });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
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
        // Refresh local allApplicants on client is handled via fetch
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// --- SEND LETTER VIA EMAIL ---
app.post('/api/admin/send-letter', async (req, res) => {
    try {
        const { email, letterType, pdfBase64 } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company   = await Company.findOne();
        if (!applicant || !company) return res.status(404).json({ error: 'Not found' });

        const letterLabel = letterType === 'offer' ? 'Offer Letter' : 'Appointment Letter';
        const fileName    = `${letterLabel.replace(/ /g,'_')}_${applicant.fullName.replace(/ /g,'_')}.pdf`;
        const pdfBuffer   = Buffer.from(pdfBase64.split(',')[1], 'base64');

        await transporter.sendMail({
            from: `"${company.name}" <${process.env.EMAIL_USER}>`,
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

// Advanced Asset Upload (Stores in Asset DB)
app.post('/api/company-profile', async (req, res) => {
    try {
        const updateData = req.body;
        let profile = await Company.findOne();
        if (!profile) profile = await Company.create({});

        // Handle File Assets (logo, stamp, signature, letterheadImage)
        const assetTypeMap = {
            logo: 'logo',
            stamp: 'stamp',
            digitalSignature: 'signature',
            letterheadImage: 'letterhead'
        };

        for (const [field, type] of Object.entries(assetTypeMap)) {
            if (updateData[field] && updateData[field].length > 0) {
                const file = updateData[field][0];
                const newAsset = await Asset.create({
                    category: type,
                    name: file.name,
                    data: file.data
                });
                
                // Link to profile
                const profileKey = field === 'digitalSignature' ? 'activeSignatureId' : 
                                  (field === 'letterheadImage' ? 'activeLetterheadId' : 
                                  `active${field.charAt(0).toUpperCase() + field.slice(1)}Id`);
                
                profile[profileKey] = newAsset._id;
                delete updateData[field]; // Don't save blob in Main DB
            }
        }

        Object.assign(profile, updateData);
        profile.updatedAt = new Date();
        await profile.save();
        
        res.status(200).json({ success: true, profile });
    } catch (error) { 
        console.error('Upload error:', error);
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
            'signature': 'activeSignatureId',
            'letterhead': 'activeLetterheadId'
        };

        const field = map[category];
        if (!field) return res.status(400).json({ error: 'Invalid category' });

        company[field] = assetId;
        await company.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to set active asset' }); }
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
            company.letterCounter = company.letterCounterStart || 1001;
            await company.save();
        }
        res.json({ success: true, message: 'Applicant database cleared' });
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
        const categories = ['logo','stamp','digitalSignature','letterheadImage','mobileAppTemplate','tadaTemplate'];
        let changed = false;
        categories.forEach(cat => {
            if (profile[cat] && profile[cat].length > 0) {
                if (typeof profile[cat][0] === 'string') {
                    profile[cat] = profile[cat].map((s, i) => ({ name: `Legacy_${i+1}`, data: s }));
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
