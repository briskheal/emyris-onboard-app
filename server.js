const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
            to: process.env.EMAIL_USER, // Sending to self for now as admin
            subject: `New Application: ${formData.firstName} ${formData.lastName} - ${formData.designation}`,
            html: emailHtml
        });

        res.status(200).json({ success: true, message: 'Application submitted and email sent successfully!' });
    } catch (error) {
        console.error('Error processing submission:', error);
        res.status(500).json({ success: false, message: 'Failed to send email notification.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
