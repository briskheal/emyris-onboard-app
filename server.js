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
    updatedAt: { type: Date, default: Date.now }
});

const submissionSchema = new mongoose.Schema({
    submissionId: String,
    firstName: String,
    lastName: String,
    capturedTime: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' }
});

const Company = mongoose.model('Company', companySchema);
const Submission = mongoose.model('Submission', submissionSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (index.html, script.js, style.css)

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/submit-onboarding', async (req, res) => {
    try {
        const formData = req.body;
        console.log('Received onboarding submission:', formData.firstName, formData.lastName);
        const subId = `EM-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // --- Save to MongoDB if connected ---
        if (mongoose.connection.readyState === 1) {
            try {
                await Submission.create({
                    submissionId: subId,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    status: 'pending'
                });
                console.log('Saved submission to MongoDB');
            } catch (dbErr) {
                console.error('MongoDB Save Error:', dbErr);
            }
        }

        // Prepare email content
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">New Employee Onboarding Submission</h2>
                <p>A new application has been submitted through the Emyris Onboarding Portal.</p>
                
                <h3 style="background: #f8f9fa; padding: 10px;">Personal Details</h3>
                <ul>
                    <li><strong>Name:</strong> ${formData.firstName} ${formData.middleName || ''} ${formData.lastName}</li>
                    <li><strong>DOB:</strong> ${formData.dob}</li>
                    <li><strong>Gender:</strong> ${formData.gender}</li>
                    <li><strong>Blood Group:</strong> ${formData.bloodGroup}</li>
                    <li><strong>Father's Name:</strong> ${formData.fatherName}</li>
                </ul>

                <h3 style="background: #f8f9fa; padding: 10px;">Professional Details</h3>
                <ul>
                    <li><strong>Designation:</strong> ${formData.designation}</li>
                    <li><strong>Expected Joining Date:</strong> ${formData.joiningDate}</li>
                    <li><strong>Annual Salary:</strong> ₹${formData.salary}</li>
                    <li><strong>HQ:</strong> ${formData.hq}</li>
                </ul>

                <h3 style="background: #f8f9fa; padding: 10px;">Contact Info</h3>
                <ul>
                    <li><strong>Email/User:</strong> ${formData.email || 'N/A'}</li>
                    <li><strong>Phone:</strong> ${formData.phone}</li>
                    <li><strong>Address:</strong> ${formData.address}, ${formData.city}, ${formData.state} - ${formData.pin}</li>
                </ul>

                <p style="margin-top: 20px; font-size: 0.9em; color: #7f8c8d;">
                    This is an automated notification from the Emyris Onboarding System.
                </p>
            </div>
        `;

        // Send Email to Admin
        await transporter.sendMail({
            from: `"Emyris Onboarding" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `New Application: ${formData.firstName} ${formData.lastName} - ${formData.designation}`,
            html: emailHtml
        });

        res.status(200).json({ success: true, submissionId: subId, message: 'Application submitted successfully!' });
    } catch (error) {
        console.error('Error processing submission:', error);
        res.status(500).json({ success: false, message: 'Failed to process submission.' });
    }
});

// Admin Login Endpoint
app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;
    
    // Check against Environment Variables
    const expectedUser = process.env.ADMIN_USER || 'admin';
    const expectedPass = process.env.ADMIN_PASS || 'admin123';

    if (username === expectedUser && password === expectedPass) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// --- NEW MongoDB Endpoints for Company Profile ---

app.get('/api/company-profile', async (req, res) => {
    try {
        let profile = await Company.findOne();
        if (!profile) {
            profile = await Company.create({ name: "EMYRIS BIOLIFESCIENCES PVT LTD." });
        }
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
