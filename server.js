const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB Atlas'))
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.warn('MONGODB_URI not found. Data will not be persisted to database.');
}

// Schemas
const companySchema = new mongoose.Schema({
    name: { type: String, default: "EMYRIS BIOLIFESCIENCES PVT LTD." },
    address: String,
    phone: String,
    tollFree: String,
    website: String,
    logo: String, // Base64
    offerTemplate: String, // Global master offer letter
    apptTemplate: String,  // Global master appointment letter
    mobileAppTemplate: String, // Global master mobile app details
    tadaTemplate: String,      // Global master TA/DA letter
    updatedAt: { type: Date, default: Date.now }
});

const applicantSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true }, // 6-digit PIN
    status: { type: String, default: 'draft' }, // draft, submitted, approved, rejected
    canLogin: { type: Boolean, default: true },
    formData: { type: Object, default: {} },
    registeredAt: { type: Date, default: Date.now },
    submittedAt: Date,
    approvedAt: Date, // Track approval for 7-day auto-lock
    documents: [Object], // Track uploaded file metadata
    tasks: {
        offerLetter: { type: Boolean, default: false },
        appointmentLetter: { type: Boolean, default: false },
        appLinkSent: { type: Boolean, default: false },
        loginDetailsSent: { type: Boolean, default: false }
    }
});

const Company = mongoose.model('Company', companySchema);
const Applicant = mongoose.model('Applicant', applicantSchema);

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

// Company Profile
app.get('/api/company-profile', async (req, res) => {
    try {
        let profile = await Company.findOne();
        if (!profile) profile = await Company.create({ name: "EMYRIS BIOLIFESCIENCES PVT LTD." });
        res.status(200).json(profile);
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/company-profile', async (req, res) => {
    try {
        const updateData = req.body;
        let profile = await Company.findOne();
        if (profile) {
            Object.assign(profile, updateData);
            profile.updatedAt = new Date();
            await profile.save();
        } else {
            profile = await Company.create(updateData);
        }
        res.status(200).json({ success: true, profile });
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
