const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Company, Applicant, Question, ExamResult, Asset, EmailLog } = require('../db');
// You may need to port upload middleware and other shared utilities here.

router.get('/uploads/:filename', async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
            if (req.query.download === 'true') {
                return res.download(filePath, req.query.name || filename);
            }
            return res.sendFile(filePath);
        }
        // Fallback: Check if stored in Asset database
        const asset = await Asset.findById(filename) || await Asset.findOne({ where: { name: filename } });
        if (asset && asset.data) {
            const matches = asset.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], 'base64');
                res.set('Content-Type', matches[1]);
                if (req.query.download === 'true') {
                    res.set('Content-Disposition', `attachment; filename="${req.query.name || filename}"`);
                }
                return res.send(buffer);
            }
        }
        res.status(404).send('Document file not found on server or database.');
    } catch (e) {
        res.status(500).send('Error retrieving document.');
    }
});

// GET /api/admin/company - for Settings page
router.get('/company', async (req, res) => {
    try {
        const company = await Company.findOne();
        res.json({ success: true, company: company || {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json({ success: true, questions });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/questions', async (req, res) => {
    try {
        await Question.create(req.body);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/schedule-exam', async (req, res) => {
    try {
        const { date, product, mcqTime, descTime, mcqCount } = req.body;
        const company = await Company.findOne();
        if (company) {
            await Company.updateOne({ _id: company._id }, { 
                $set: { 
                    activeExamDate: date, 
                    activeExamProduct: product || '',
                    examMcqTime: mcqTime || 15,
                    examDescriptiveTime: descTime || 15,
                    examMcqCount: mcqCount || 10
                } 
            });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (e) {
        console.error('Schedule Exam Error:', e);
        res.status(500).json({ error: 'Failed to schedule exam' });
    }
});

router.get('/exam-reports', async (req, res) => {
    try {
        const results = await ExamResult.find();
        res.json({ success: true, results });
    } catch (e) {
        console.error('Fetch Exam Reports Error:', e);
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = (process.env.ADMIN_USER || 'EMYRIS@BIOLIFE').toUpperCase();
    const adminPass = process.env.ADMIN_PASS || 'Omrutam@1306';

    if (username && username.toUpperCase() === adminUser && password === adminPass) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

router.get('/applicant-pin/:email', async (req, res) => {
    try {
        const applicant = await Applicant.findOne({ email: req.params.email }).select('fullName email password status');
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
        res.json({ name: applicant.fullName, email: applicant.email, pin: applicant.password, status: applicant.status });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/add-existing-staff', async (req, res) => {
    try {
        const { fullName, email, phone, empCode, designation, targetSalary, division, hq, joinDate, dob, address, reportingTo, pin, state,
                customPin, epfNumber, uanNumber, esiNumber, bankName, accNo, ifsc } = req.body;

        // Validation: Only Name, Email, and Phone are strictly mandatory for rapid account creation
        if (!fullName || !email || !phone) {
            return res.status(400).json({ success: false, message: 'Name, Email, and Phone are mandatory.' });
        }
        // customPin is the portal login PIN. Fall back to pin (pincode) if not set.
        const portalPin = (customPin && customPin.toString().length === 6) ? customPin.toString() : Math.floor(100000 + Math.random() * 900000).toString();

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

        // Robust Date Parsing
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

        const joinDateObj = parseDMY(joinDate);
        const dobObj = parseDMY(dob);

        // Construct the fast-tracked profile directly into 'approved' state
        await Applicant.create({
            fullName,
            email,
            phone,
            password: portalPin,          // Admin-assigned 6-digit portal login PIN
            status: 'approved',           // Bypass draft/submitted/verification
            isExistingStaff: true,        // Bypass rapid test + offer flow in portal
            canLogin: true,               // Allow employee to log in via Resume Journey
            rapidTestCompleted: true,     // Skip rapid test entirely
            approvedAt: new Date(),
            division: division || 'General',
            hq: hq || 'Unassigned',
            empCode: empCode || '',
            actualJoiningDate: joinDate,
            address: address || '',       // Top-level address field (FIXED from current_address)
            pin,
            state,
            // Optional statutory fields
            epfNumber: epfNumber || '',
            uanNumber: uanNumber || '',
            esiNumber: esiNumber || '',
            formData: {
                designation: designation || 'Employee',
                salary: formattedSalary.toString(),
                dob: dob,
                pin,
                state,
                address: address || '',   // FIXED: was current_address, now matches what portal reads
                bankName: bankName || '',
                accNo: accNo || '',
                ifsc: ifsc || '',
                first_name: fullName.split(' ')[0],
                last_name: fullName.split(' ').slice(1).join(' ') || ''
            },
            dob: dob,
            salaryBreakup: salaryBreakup,
            tasks: {
                offerLetter: true,        // Auto-flagged as done (no email sent)
                appointmentLetter: true,  // Auto-flagged as done (no email sent)
                appLinkSent: false,
                loginDetailsSent: false
            }
        });

        // Send email to existing staff with their login PIN
        const portalUrl = req.headers.origin || process.env.APP_URL || 'https://onboard.emyrisbio.com';
        
        // Wrap in try-catch to not block the success response if email fails
        try {
            await sendEmail({
                to: email,
                subject: `Welcome to Emyris Staff Portal - Your Login Credentials`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #10b981;">Emyris Biolifesciences Staff Portal</h2>
                        <p>Dear ${fullName},</p>
                        <p>Your employee record has been created in the Emyris Staff Portal. Please log in to complete your profile and upload any required documents.</p>
                        
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Portal URL:</strong> <a href="${portalUrl}" style="color: #3b82f6;">${portalUrl}</a></p>
                            <p style="margin: 0 0 10px 0;"><strong>Login Email:</strong> ${email}</p>
                            <p style="margin: 0;"><strong>Secure PIN:</strong> <span style="font-size: 1.2em; font-weight: bold; letter-spacing: 2px; color: #10b981;">${portalPin}</span></p>
                        </div>
    
                        <p><strong>Instructions:</strong></p>
                        <ol>
                            <li>Click the portal link above.</li>
                            <li>Click on <strong>"Resume Journey"</strong>.</li>
                            <li>Enter your email and the 6-digit PIN provided above.</li>
                            <li>Review and update your personal, statutory, and bank details.</li>
                            <li>Upload your required documents (Aadhar, PAN, etc.) and submit.</li>
                        </ol>
    
                        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                            If you have any issues logging in, please contact the HR team.<br>
                            — Emyris HR Team
                        </p>
                    </div>
                `
            });
            console.log(`📧 [EMAIL SENT] Credentials sent to ${email}`);
        } catch (emailErr) {
            console.error(`❌ [EMAIL ERROR] Failed to send credentials to ${email}:`, emailErr);
        }

        console.log(`✅ [FAST-TRACK] Added existing staff member: ${email} (${fullName}) | Portal PIN: ${portalPin}`);
        res.status(200).json({ success: true, message: 'Existing staff added successfully.', portalPin, email });

    } catch (error) {
        console.error('Fast-track error:', error);
        res.status(500).json({ success: false, message: 'Failed to add existing staff.' });
    }
});

router.post('/bulk-add-existing-staff', async (req, res) => {
    try {
        const { staffList } = req.body;
        if (!staffList || !Array.isArray(staffList)) {
            return res.status(400).json({ success: false, message: 'Invalid data format.' });
        }

        const results = { success: 0, failed: 0, errors: [] };

        for (const staff of staffList) {
            try {
                const { fullName, email, phone, empCode, designation, targetSalary, division, hq, joinDate, dob, address, reportingTo } = staff;

                // STRICT VALIDATION: All fields are now mandatory
                const missing = [];
                if (!fullName) missing.push("Full Name");
                if (!email) missing.push("Email");
                if (!phone) missing.push("Phone");
                if (!empCode) missing.push("Employee Code");
                if (!designation) missing.push("Designation");
                if (!division) missing.push("Division");
                if (!hq) missing.push("HQ");
                if (!reportingTo) missing.push("Reporting To");
                if (!joinDate) missing.push("Joining Date");
                if (!targetSalary) missing.push("Annual CTC");
                if (!dob) missing.push("DOB");
                if (!address) missing.push("Address");

                if (missing.length > 0) {
                    results.failed++;
                    results.errors.push(`${email || fullName || 'Unknown'}: Missing [${missing.join(', ')}]`);
                    continue;
                }

                const existing = await Applicant.findOne({ email });
                if (existing) {
                    results.failed++;
                    results.errors.push(`${email}: Already exists`);
                    continue;
                }

                const formattedSalary = parseFloat(targetSalary) || 0;
                let salaryBreakup = {};
                if (formattedSalary > 0) {
                    const monthly = parseFloat((formattedSalary / 12).toFixed(2));
                    const basic = parseFloat((monthly * 0.40).toFixed(2));
                    const hra = parseFloat((basic * 0.40).toFixed(2));
                    const edu = 200.00;
                    const conveyance = 3000.00;
                    const medical = 1250.00;
                    const ltaBase = monthly - (basic + hra);
                    const lta = parseFloat((ltaBase * 0.07).toFixed(2));
                    const used = parseFloat((basic + hra + lta + edu + conveyance + medical).toFixed(2));
                    const special = parseFloat((monthly - used).toFixed(2));
                    
                    salaryBreakup = {
                        v_salBasic: basic.toFixed(2), v_salHra: hra.toFixed(2), v_salLta: lta.toFixed(2),
                        v_salConv: conveyance.toFixed(2), v_salMed: medical.toFixed(2), v_salEdu: edu.toFixed(2),
                        v_salFixed: "0.00", v_salSpecial: special.toFixed(2)
                    };
                }

                // Parse DD-MM-YYYY
                const parseDMY = (s) => {
                    if (!s || typeof s !== 'string') return null;
                    const parts = s.split('-');
                    if (parts.length !== 3) return null;
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                };

                const joinDateObj = parseDMY(joinDate) || new Date(joinDate);
                const dobObj = parseDMY(dob) || new Date(dob);

                await Applicant.create({
                    fullName, email, phone,
                    password: 'EXISTING_STAFF_NO_PIN',
                    status: 'approved',
                    isExistingStaff: true,
                    canLogin: false,
                    approvedAt: new Date(),
                    division: division || 'General',
                    reportingTo: reportingTo || '',
                    hq: hq || 'Unassigned',
                    empCode: empCode || '',
                    actualJoiningDate: joinDate,
                    formData: {
                        designation: designation || 'Employee',
                        salary: formattedSalary.toString(),
                        dob: dob, // Keep as string for display
                        current_address: address || '',
                        first_name: fullName.split(' ')[0],
                        last_name: fullName.split(' ').slice(1).join(' ') || ''
                    },
                    dob: dob,
                    salaryBreakup: salaryBreakup,
                    tasks: { offerLetter: true, appointmentLetter: false, appLinkSent: false, loginDetailsSent: false }
                });

                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`${staff.email || 'Unknown'}: ${err.message}`);
            }
        }

        res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('Bulk add error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

router.get('/applicants', async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = {};
        
        if (year && year !== 'all' && month && month !== 'all') {
            const y = parseInt(year);
            const m = parseInt(month);
            const startDate = new Date(y, m, 1);
            const endDate = new Date(y, m + 1, 1);
            query = { 
                $or: [
                    { submittedAt: { $gte: startDate, $lt: endDate } },
                    { registeredAt: { $gte: startDate, $lt: endDate }, submittedAt: null }
                ] 
            };
        } else if (year && year !== 'all') {
            const y = parseInt(year);
            const startDate = new Date(y, 0, 1);
            const endDate = new Date(y + 1, 0, 1);
            query = { 
                $or: [
                    { submittedAt: { $gte: startDate, $lt: endDate } },
                    { registeredAt: { $gte: startDate, $lt: endDate }, submittedAt: null }
                ] 
            };
        }

        // Optimization: Exclude Large Document Data from the Main List
        const applicants = await Applicant.find(query)
            .select('-offerLetterData -apptLetterData') // Strip heavy embedded HTML/base64 data
            .sort({ registeredAt: -1 })
            .lean(); // Fetch as plain objects to easily mutate
        
        // Manually strip nested base64 data from documents since Sequelize doesn't support dot notation excludes natively
        const optimizedApplicants = applicants.map(app => {
            if (app.documents && Array.isArray(app.documents)) {
                app.documents = app.documents.map(d => ({
                    category: d.category,
                    name: d.name,
                    assetId: d.assetId,
                    uploadedAt: d.uploadedAt
                    // Intentionally omitting 'data' (the heavy base64 string)
                }));
            }
            return app;
        });

        res.status(200).json(optimizedApplicants);
    } catch (error) {
        console.error("List Fetch Error:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET single applicant (Lazy loading heavy data on demand)
app.get('/api/admin/applicant/:email', async (req, res) => {
    try {
        const applicant = await Applicant.findOne({ email: req.params.email });
        if (!applicant) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(applicant);
    } catch (error) {
        console.error("Fetch Single Error:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Public Endpoint to Serve Static Assets (Logos, Signatures, Stamps)
app.get('/api/public/asset/:assetId', async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.assetId);
        if (!asset || !asset.data) return res.status(404).send('Asset not found');

        const matches = asset.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return res.status(400).send('Invalid asset format');

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year (Static Provision)
        res.send(buffer);
    } catch (error) {
        res.status(500).send('Failed to fetch static asset');
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

app.post('/api/admin/delete-document', async (req, res) => {
    try {
        const { email, assetId } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
        
        const targetId = String(assetId).trim();
        const updatedDocs = (applicant.documents || []).filter(d => {
            const dId = String(d.assetId || d._id || d.id || '').trim();
            return dId !== targetId;
        });
        await Applicant.updateOne({ _id: applicant._id }, { $set: { documents: updatedDocs } });

        const cleanFilename = String(assetId).split('/').pop().trim();
        const filePath = path.join(__dirname, 'uploads', cleanFilename);
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
        }
        if (Asset.findByIdAndDelete) {
            await Asset.findByIdAndDelete(cleanFilename).catch(() => {});
        } else {
            await Asset.destroy({ where: { _id: cleanFilename } }).catch(() => {});
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Delete doc error:', e);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

app.post('/api/admin/reject-document', async (req, res) => {
    try {
        const { email, docCategory, reason } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        // Unlock login so they can fix it
        applicant.canLogin = true;
        // Optionally mark the specific doc as rejected in verificationChecks
        const checks = { ...(applicant.verificationChecks || {}) };
        checks[docCategory] = 'rejected';
        await Applicant.updateOne({ _id: applicant._id }, { $set: { canLogin: true, verificationChecks: checks } });

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
                    <a href="${BASE_URL}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Login to Portal</a>
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
        // Calculate database size by summing all tables in the public schema
        const [results] = await sequelize.query("SELECT sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint as size FROM pg_tables WHERE schemaname = 'public'");
        const totalUsed = parseInt(results[0].size || '0', 10);
        
        // Calculate size of uploaded files in /uploads directory
        let uploadsSize = 0;
        try {
            const uploadsDir = path.join(__dirname, 'uploads');
            if (fs.existsSync(uploadsDir)) {
                const files = fs.readdirSync(uploadsDir);
                for (const file of files) {
                    try {
                        const st = fs.statSync(path.join(uploadsDir, file));
                        uploadsSize += st.size;
                    } catch (e) {}
                }
            }
        } catch (e) {}

        const totalStorageUsed = totalUsed + uploadsSize;

        // Query real server hard drive capacity using Node.js fs.statfsSync
        let diskTotal = 1024 * 1024 * 1024; // fallback 1GB
        let diskFree = 0;
        try {
            if (typeof fs.statfsSync === 'function') {
                const st = fs.statfsSync(__dirname);
                diskTotal = st.blocks * st.bsize;
                diskFree = st.bavail * st.bsize;
            }
        } catch (e) {}

        res.json({
            success: true,
            main: { used: totalUsed, storage: totalStorageUsed, objects: 0 },
            assets: { used: uploadsSize, storage: uploadsSize, objects: 0 },
            summary: {
                totalUsedBytes: totalStorageUsed,
                totalStorageUsedBytes: totalStorageUsed,
                limitBytes: diskTotal,
                diskFreeBytes: diskFree,
                usedPercentage: ((totalStorageUsed / diskTotal) * 100).toFixed(2),
                leftPercentage: ((diskFree / diskTotal) * 100).toFixed(2)
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
            await Division.updateOne({ _id: existing._id }, { $set: { active: true } });
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
            await HQ.updateOne({ _id: existing._id }, { $set: { active: true } });
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
        } else if (type === 'revised_salary') {
            counterKey = 'revisedSalaryCounter';
            prefix = "EMY/RSV";
        } else if (type === 'emyfe') {
            counterKey = 'empCodeCounter';
            prefix = "EMYFE";
        } else if (type === 'emyho') {
            counterKey = 'empCodeCounter';
            prefix = "EMYHO";
        } else if (type === 'emyhr') {
            counterKey = 'empCodeCounter';
            prefix = "EMYHR";
        }

        const counter = company[counterKey] || 0;
        const fyFrom = company.fyFrom ? new Date(company.fyFrom) : new Date();
        const fyTo = company.fyTo ? new Date(fyTo.fyTo) : new Date();
        const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;

        const refNo = (['EMYFE', 'EMYHO', 'EMYHR'].includes(prefix)) 
            ? `${prefix}${counter}` 
            : `${prefix}/${counter}/${fyShort}`;

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
        else if (type === 'confirm') update.confirmLetterBody = body;
        else if (type === 'revised_salary') update.revisedSalaryBody = body;
        else if (type === 'experience') update.experienceLetterBody = body;
        else if (type === 'relieving') update.relievingLetterBody = body;
        else if (type === 'warning') update.warningLetterBody = body;
        else if (type === 'show_cause') update.showCauseLetterBody = body;
        else if (type === 'emyfe') update.emyfeLetterBody = body;
        else if (type === 'emyho') update.emyhoLetterBody = body;
        else if (type === 'emyhr') update.emyhrLetterBody = body;
        else if (type === 'incentive') update.incentiveCircularBody = body;
        else if (type.startsWith('misc_')) {
            const id = type.split('_')[1];
            // We'll need specialized logic for misc if it's an array
            // For now let's handle offer/appt which are primary
        }

        let company = await Company.findOne();
        if (!company) company = await Company.create(update);
        else {
            await Company.updateOne({ _id: company._id }, { $set: update });
        }

        res.json({ success: true, message: 'Template saved successfully' });

        // Save to History
        try {
            const versionCount = await TemplateHistory.countDocuments({ type });
            await TemplateHistory.create({
                type,
                content: body,
                savedBy: 'Admin', // In a real app, use the session user
                version: versionCount + 1
            });
        } catch (histErr) {
            console.warn('⚠️ Failed to save history entry:', histErr.message);
        }
    }

router.get('/applicant/:email', async (req, res) => {
    try {
        const applicant = await Applicant.findOne({ email: req.params.email });
        if (!applicant) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(applicant);
    } catch (error) {
        console.error("Fetch Single Error:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/document/:assetId', async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.assetId);
        if (!asset) return res.status(404).json({ error: 'Document data not found' });
        res.json({ data: asset.data });
    } catch (e) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

router.post('/toggle-access', async (req, res) => {
    try {
        const { email, canLogin } = req.body;
        await Applicant.findOneAndUpdate({ email }, { canLogin });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/update-status', async (req, res) => {
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

router.post('/reset-applicant', async (req, res) => {
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

router.post('/update-task', async (req, res) => {
    try {
        const { email, taskKey, value } = req.body;
        const update = {};
        update[`tasks.${taskKey}`] = value;
        await Applicant.findOneAndUpdate({ email }, { $set: update });
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Update failed' }); }
});

router.post('/delete-document', async (req, res) => {
    try {
        const { email, assetId } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
        
        const targetId = String(assetId).trim();
        const updatedDocs = (applicant.documents || []).filter(d => {
            const dId = String(d.assetId || d._id || d.id || '').trim();
            return dId !== targetId;
        });
        await Applicant.updateOne({ _id: applicant._id }, { $set: { documents: updatedDocs } });

        const cleanFilename = String(assetId).split('/').pop().trim();
        const filePath = path.join(__dirname, 'uploads', cleanFilename);
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
        }
        if (Asset.findByIdAndDelete) {
            await Asset.findByIdAndDelete(cleanFilename).catch(() => {});
        } else {
            await Asset.destroy({ where: { _id: cleanFilename } }).catch(() => {});
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Delete doc error:', e);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

router.post('/reject-document', async (req, res) => {
    try {
        const { email, docCategory, reason } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        // Unlock login so they can fix it
        applicant.canLogin = true;
        // Optionally mark the specific doc as rejected in verificationChecks
        const checks = { ...(applicant.verificationChecks || {}) };
        checks[docCategory] = 'rejected';
        await Applicant.updateOne({ _id: applicant._id }, { $set: { canLogin: true, verificationChecks: checks } });

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
                    <a href="${BASE_URL}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Login to Portal</a>
                </div>
            `
        });

        res.json({ success: true, message: 'Rejection email sent and login unlocked.' });
    } catch (e) {
        console.error('Reject Error:', e);
        res.status(500).json({ error: 'Failed to process rejection' });
    }
});

router.get('/divisions', async (req, res) => {
    try {
        const divisions = await Division.find({ active: true }).sort({ name: 1 });
        res.json(divisions);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/hqs', async (req, res) => {
    try {
        const hqs = await HQ.find({ active: true }).sort({ name: 1 });
        res.json(hqs);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/db-stats', async (req, res) => {
    try {
        // Calculate database size by summing all tables in the public schema
        const [results] = await sequelize.query("SELECT sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint as size FROM pg_tables WHERE schemaname = 'public'");
        const totalUsed = parseInt(results[0].size || '0', 10);
        
        // Calculate size of uploaded files in /uploads directory
        let uploadsSize = 0;
        try {
            const uploadsDir = path.join(__dirname, 'uploads');
            if (fs.existsSync(uploadsDir)) {
                const files = fs.readdirSync(uploadsDir);
                for (const file of files) {
                    try {
                        const st = fs.statSync(path.join(uploadsDir, file));
                        uploadsSize += st.size;
                    } catch (e) {}
                }
            }
        } catch (e) {}

        const totalStorageUsed = totalUsed + uploadsSize;

        // Query real server hard drive capacity using Node.js fs.statfsSync
        let diskTotal = 1024 * 1024 * 1024; // fallback 1GB
        let diskFree = 0;
        try {
            if (typeof fs.statfsSync === 'function') {
                const st = fs.statfsSync(__dirname);
                diskTotal = st.blocks * st.bsize;
                diskFree = st.bavail * st.bsize;
            }
        } catch (e) {}

        res.json({
            success: true,
            main: { used: totalUsed, storage: totalStorageUsed, objects: 0 },
            assets: { used: uploadsSize, storage: uploadsSize, objects: 0 },
            summary: {
                totalUsedBytes: totalStorageUsed,
                totalStorageUsedBytes: totalStorageUsed,
                limitBytes: diskTotal,
                diskFreeBytes: diskFree,
                usedPercentage: ((totalStorageUsed / diskTotal) * 100).toFixed(2),
                leftPercentage: ((diskFree / diskTotal) * 100).toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/toggle-access', async (req, res) => {
    try {
        const { email, canLogin } = req.body;
        await Applicant.findOneAndUpdate({ email }, { canLogin });
        res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/divisions', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });
        
        const cleanName = name.toUpperCase().trim();
        // Strict duplicate check across ALL records (including inactive ones)
        const existing = await Division.findOne({ name: cleanName });
        
        if (existing) {
            await Division.updateOne({ _id: existing._id }, { $set: { active: true } });
        } else {
            await Division.create({ name: cleanName });
        }
        res.json({ success: true });
    } catch (e) { 
        console.error("Division add error:", e);
        res.status(500).json({ error: 'Failed' }); 
    }
});

router.post('/hqs', async (req, res) => {
    try {
        const { name } = req.body;
        const existing = await HQ.findOne({ name: name.toUpperCase().trim() });
        if (existing) {
            await HQ.updateOne({ _id: existing._id }, { $set: { active: true } });
        } else {
            await HQ.create({ name: name.toUpperCase().trim() });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/next-ref', async (req, res) => {
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
        } else if (type === 'revised_salary') {
            counterKey = 'revisedSalaryCounter';
            prefix = "EMY/RSV";
        } else if (type === 'emyfe') {
            counterKey = 'empCodeCounter';
            prefix = "EMYFE";
        } else if (type === 'emyho') {
            counterKey = 'empCodeCounter';
            prefix = "EMYHO";
        } else if (type === 'emyhr') {
            counterKey = 'empCodeCounter';
            prefix = "EMYHR";
        }

        const counter = company[counterKey] || 0;
        const fyFrom = company.fyFrom ? new Date(company.fyFrom) : new Date();
        const fyTo = company.fyTo ? new Date(fyTo.fyTo) : new Date();
        const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;

        const refNo = (['EMYFE', 'EMYHO', 'EMYHR'].includes(prefix)) 
            ? `${prefix}${counter}` 
            : `${prefix}/${counter}/${fyShort}`;

        const updateObj = {};
        updateObj[counterKey] = counter + 1;
        await Company.findOneAndUpdate({}, updateObj);

        res.json({ success: true, refNo, counter });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/save-template', async (req, res) => {
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
        else if (type === 'confirm') update.confirmLetterBody = body;
        else if (type === 'revised_salary') update.revisedSalaryBody = body;
        else if (type === 'experience') update.experienceLetterBody = body;
        else if (type === 'relieving') update.relievingLetterBody = body;
        else if (type === 'warning') update.warningLetterBody = body;
        else if (type === 'show_cause') update.showCauseLetterBody = body;
        else if (type === 'emyfe') update.emyfeLetterBody = body;
        else if (type === 'emyho') update.emyhoLetterBody = body;
        else if (type === 'emyhr') update.emyhrLetterBody = body;
        else if (type === 'incentive') update.incentiveCircularBody = body;
        else if (type.startsWith('misc_')) {
            const id = type.split('_')[1];
            // We'll need specialized logic for misc if it's an array
            // For now let's handle offer/appt which are primary
        }

        let company = await Company.findOne();
        if (!company) company = await Company.create(update);
        else {
            await Company.updateOne({ _id: company._id }, { $set: update });
        }

        res.json({ success: true, message: 'Template saved successfully' });

        // Save to History
        try {
            const versionCount = await TemplateHistory.countDocuments({ type });
            await TemplateHistory.create({
                type,
                content: body,
                savedBy: 'Admin', // In a real app, use the session user
                version: versionCount + 1
            });
        } catch (histErr) {
            console.warn('⚠️ Failed to save history entry:', histErr.message);
        }
    } catch (e) {
        console.error('Save template error:', e);
        res.status(500).json({ success: false, error: 'Database save failed' });
    }
});

app.get('/api/admin/template-history/:type', async (req, res) => {
    try {
        const history = await TemplateHistory.find({ type: req.params.type })
            .sort({ savedAt: -1 })
            .limit(10);
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.post('/api/admin/render-template', async (req, res) => {
    try {
        const { email, type, customBody } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne();
        
        if (!applicant || !company) return res.status(404).json({ error: 'Data missing' });

        const sigAsset = company.activeSignatureId ? await Asset.findById(company.activeSignatureId) : null;
        // STATIC ASSET PROVISION: Use lightweight URL instead of heavy base64
        const signatureHtml = company.activeSignatureId ? `<img src="https://emyrishr.in/api/public/asset/${company.activeSignatureId}" style="max-width: 150px; max-height: 80px; mix-blend-mode: multiply;" alt="Signature" />` : '<br><br><br>';

        let template = customBody;
        if (!template) {
            switch(type) {
                case 'offer': template = company.offerLetterBody; break;
                case 'appt': template = company.apptLetterBody; break;
                case 'confirm': template = company.confirmLetterBody; break;
                case 'revised_salary': template = company.revisedSalaryBody; break;
                case 'experience': template = company.experienceLetterBody; break;
                case 'relieving': template = company.relievingLetterBody; break;
                case 'warning': template = company.warningLetterBody; break;
                case 'show_cause': template = company.showCauseLetterBody; break;
                default: template = company.apptLetterBody;
            }
        }
        
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
            'ADDRESS': applicant.address || fd.address || '',
            'DOB': applicant.dob || fd.dob || '',
            'CITY_STATE': `${fd.city || ''}, ${fd.state || ''}`,
            'PIN': fd.pin || '',
            'DESIGNATION': applicant.designation || fd.designation || '',
            'DIVISION': applicant.division || '',
            'HQ': applicant.hq || fd.hq || '',
            'JOINING_DATE': applicant.actualJoiningDate || (fd.joiningDate ? new Date(fd.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
            'REPORTING_TO': applicant.reportingTo || '',
            'SALARY_MONTHLY': monthlyTotal.toLocaleString('en-IN'),
            'SALARY_ANNUAL': annualCTC.toLocaleString('en-IN'),
            'SALARY_WORDS': (numberToWords(annualCTC) + ' ONLY').toUpperCase(),
            'COMPANY_NAME': company.name,
            'SIGNATORY_NAME': company.signatoryName || '',
            'SIGNATORY_DESG': company.signatoryDesignation || '',
            'COMPANY_SIGNATURE': signatureHtml,
            'REF_NO': applicant.refNo || `${type === 'appt' ? 'EMY/APT' : 'EMY/OFR'}/${(type === 'appt' ? company.apptCounter : company.offerCounter) || 1001}/${String(new Date(company.fyFrom || Date.now()).getFullYear()).slice(2)}-${String(new Date(company.fyTo || Date.now()).getFullYear()).slice(2)}`,
            'TODAY_DATE': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            'EMP_CODE': applicant.empCode || applicant.formData?.empCode || 'TBD'
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
        const { email, division, reportingTo, hq, empCode, refNo, salaryBreakup, verificationChecks, dob, actualJoiningDate, address, tasks, incrementData, fullName, phone, detailDesignation, detailHq, fatherName, gender, bloodGroup, maritalStatus,
                epfNumber, uanNumber, esiNumber, anniversaryDate, bankName, accNo, ifsc } = req.body;
        const update = {};
        if (division !== undefined) update.division = division;
        if (reportingTo !== undefined) update.reportingTo = reportingTo;
        if (hq !== undefined) update.hq = hq;
        if (detailHq !== undefined) update.hq = detailHq;
        if (empCode !== undefined) update.empCode = empCode;
        if (refNo !== undefined) update.refNo = refNo;
        if (dob !== undefined) update.dob = dob;
        if (actualJoiningDate !== undefined) update.actualJoiningDate = actualJoiningDate;
        if (address !== undefined) update.address = address;
        if (verificationChecks !== undefined) update.verificationChecks = verificationChecks;
        if (tasks !== undefined) update.tasks = tasks;
        if (incrementData !== undefined) update.incrementData = incrementData;

        // Editable profile fields
        if (fullName !== undefined) update.fullName = fullName;
        if (phone !== undefined) update.phone = phone;
        if (detailDesignation !== undefined) update.designation = detailDesignation;
        if (maritalStatus !== undefined) update.maritalStatus = maritalStatus;
        if (fatherName !== undefined) update['formData.fatherName'] = fatherName;
        if (gender !== undefined) update['formData.gender'] = gender;
        if (bloodGroup !== undefined) update['formData.bloodGroup'] = bloodGroup;

        // Statutory & bank fields (all optional — never error on blank)
        if (epfNumber !== undefined) update.epfNumber = epfNumber;
        if (uanNumber !== undefined) update.uanNumber = uanNumber;
        if (esiNumber !== undefined) update.esiNumber = esiNumber;
        if (anniversaryDate !== undefined) update.anniversaryDate = anniversaryDate;
        if (bankName !== undefined) update['formData.bankName'] = bankName;
        if (accNo !== undefined) update['formData.accNo'] = accNo;
        if (ifsc !== undefined) update['formData.ifsc'] = ifsc;

        if (salaryBreakup !== undefined) {
            const s = salaryBreakup;
            const basicVal = Number(s.basic || 0);

            // SAFETY: If basic is 0 or empty, skip salary validation entirely.
            // This happens for existing staff who have no salary set yet.
            if (basicVal > 0) {
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

        await Applicant.updateOne({ _id: applicant._id }, { $set: { status: 'approved', approvedAt: new Date(), verificationChecks, canLogin: true } });

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
        const { email, letterType, letterData, notifyByEmail } = req.body; // letterData can be HTML/Text or Base64
        const update = { canLogin: true }; // Automatically ensure access when a letter is pushed to hub
        if (letterType === 'offer') update.offerLetterData = letterData;
        else if (letterType === 'appt') update.apptLetterData = letterData;

        const letterObj = {
            type: letterType,
            data: letterData,
            issuedAt: new Date()
        };

        await Applicant.findOneAndUpdate({ email }, { 
            $set: update,
            $push: { issuedLetters: letterObj }
        });

        if (notifyByEmail) {
            const applicant = await Applicant.findOne({ email });
            const company = await Company.findOne() || { name: 'Emyris Biolifesciences' };
            const label = letterType.toUpperCase().replace('_', ' ');

            await sendEmail({
                to: email,
                subject: `Important Document Update: ${label} - ${company.name}`,
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background: #6366f1; padding: 20px; text-align: center;">
                            <h2 style="color: white; margin: 0;">Document Notification</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p>Dear ${applicant.fullName},</p>
                            <p>We are pleased to inform you that a new document has been issued and published to your official onboarding hub.</p>
                            <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
                                <strong>Document Type:</strong> ${label}<br>
                                <strong>Status:</strong> Published to Hub
                            </div>
                            <p>Please log in to the portal to view, download, or accept the document.</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${BASE_URL}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Portal</a>
                            </div>
                        </div>
                        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 0.8rem; color: #64748b;">
                            This is an automated notification from ${company.name}. Please do not reply to this email.
                        </div>
                    </div>
                `
            });
        }

        res.json({ success: true, message: `Letter saved to applicant hub${notifyByEmail ? ' and applicant notified' : ''}.` });
    } catch (e) { 
        console.error("Save snapshot error:", e);
        res.status(500).json({ error: 'Save failed' }); 
    }
});

// --- NEW: APPLICANT ACCEPT OFFER ---
function safeParseDateServer(dateStr) {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

app.post('/api/applicant/accept-offer', async (req, res) => {
    try {
        const { email, actualJoiningDate } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne() || { name: 'Company' };
        if (!applicant) return res.status(404).json({ error: 'Not found' });

        await Applicant.updateOne({ _id: applicant._id }, { $set: { offerAccepted: true, offerAcceptedAt: new Date(), actualJoiningDate } });

        // 1. Congratulate Applicant
        await sendEmail({
            to: email,
            subject: `Congratulations on Joining ${company.name}! 🚀`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:30px;line-height:1.6;color:#334155;">
                    <h2 style="color:#6366f1">Welcome Aboard, ${applicant.fullName}!</h2>
                    <p>We are thrilled to officially welcome you to <strong>${company.name}</strong>.</p>
                    <p>Your acceptance of the Offer of Employment has been recorded. Your confirmed <strong>Actual Date of Joining (ADOJ)</strong> is: <strong>${safeParseDateServer(actualJoiningDate) ? safeParseDateServer(actualJoiningDate).toDateString() : actualJoiningDate}</strong>.</p>
                    <p>Your official Appointment Order and further orientation details will be shared within 30 days of your joining.</p>
                    <br>
                    <p>Best Regards,</p>
                    <p><strong>Team HR</strong><br>${company.name}</p>
                </div>`
        });

        // 2. Notify Admin
        await sendEmail({
            to: (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'hradmin@emyrishr.in').toLowerCase(),
            subject: `🔥 Offer Accepted: ${applicant.fullName}`,
            html: `
                <div style="font-family:Arial,sans-serif;padding:30px;line-height:1.6;color:#334155;">
                    <h2 style="color:#10b981">Great News! Offer Accepted</h2>
                    <p>Applicant <strong>${applicant.fullName}</strong> has officially accepted their Offer of Employment.</p>
                    <p><strong>Actual Date of Joining (ADOJ):</strong> ${safeParseDateServer(actualJoiningDate) ? safeParseDateServer(actualJoiningDate).toDateString() : 'Pending/Invalid'}</p>
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
            const parseDMY = (s) => {
                if (!s || typeof s !== 'string') return null;
                const parts = s.split('-');
                if (parts.length !== 3) return null;
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            };
            const adoj = parseDMY(app.actualJoiningDate) || new Date();
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

        // Legacy safety checks removed to allow explicit empty configurations

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

        // Hydrate with latest active divisions
        const divisions = await Division.find({ active: true }).sort({ name: 1 }).lean();
        profile.divisions = divisions;

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
            let desgs = (company.designations || []).filter(d => {
                const dept = (typeof d === 'object' ? d.department : 'SALES') || 'SALES';
                return dept.toUpperCase().trim() === div.name.toUpperCase().trim();
            });

            // FALLBACK: If no designations match this division name, provide all designations
            // This prevents "Empty Selection" issues when division names don't exactly match department keys
            if (desgs.length === 0) desgs = (company.designations || []);

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

        // Hydrate logo and letterhead
        if (company.activeLogoId) {
            const asset = await Asset.findById(company.activeLogoId).lean();
            if (asset) data.logo = asset.data;
        }
        if (company.activeLetterheadId) {
            const asset = await Asset.findById(company.activeLetterheadId).lean();
            if (asset) data.letterheadImage = [asset];
        }

        res.json(data);
    } catch (e) {
        console.error("Company data fetch error:", e);
        res.status(500).json({ error: 'Failed to fetch unified data: ' + (e ? e.message || e.toString() : '') });
    }
});

router.get('/template-history/:type', async (req, res) => {
    try {
        const history = await TemplateHistory.find({ type: req.params.type })
            .sort({ savedAt: -1 })
            .limit(10);
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

router.post('/render-template', async (req, res) => {
    try {
        const { email, type, customBody } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne();
        
        if (!applicant || !company) return res.status(404).json({ error: 'Data missing' });

        const sigAsset = company.activeSignatureId ? await Asset.findById(company.activeSignatureId) : null;
        // STATIC ASSET PROVISION: Use lightweight URL instead of heavy base64
        const signatureHtml = company.activeSignatureId ? `<img src="https://emyrishr.in/api/public/asset/${company.activeSignatureId}" style="max-width: 150px; max-height: 80px; mix-blend-mode: multiply;" alt="Signature" />` : '<br><br><br>';

        let template = customBody;
        if (!template) {
            switch(type) {
                case 'offer': template = company.offerLetterBody; break;
                case 'appt': template = company.apptLetterBody; break;
                case 'confirm': template = company.confirmLetterBody; break;
                case 'revised_salary': template = company.revisedSalaryBody; break;
                case 'experience': template = company.experienceLetterBody; break;
                case 'relieving': template = company.relievingLetterBody; break;
                case 'warning': template = company.warningLetterBody; break;
                case 'show_cause': template = company.showCauseLetterBody; break;
                default: template = company.apptLetterBody;
            }
        }
        
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
            'ADDRESS': applicant.address || fd.address || '',
            'DOB': applicant.dob || fd.dob || '',
            'CITY_STATE': `${fd.city || ''}, ${fd.state || ''}`,
            'PIN': fd.pin || '',
            'DESIGNATION': applicant.designation || fd.designation || '',
            'DIVISION': applicant.division || '',
            'HQ': applicant.hq || fd.hq || '',
            'JOINING_DATE': applicant.actualJoiningDate || (fd.joiningDate ? new Date(fd.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
            'REPORTING_TO': applicant.reportingTo || '',
            'SALARY_MONTHLY': monthlyTotal.toLocaleString('en-IN'),
            'SALARY_ANNUAL': annualCTC.toLocaleString('en-IN'),
            'SALARY_WORDS': (numberToWords(annualCTC) + ' ONLY').toUpperCase(),
            'COMPANY_NAME': company.name,
            'SIGNATORY_NAME': company.signatoryName || '',
            'SIGNATORY_DESG': company.signatoryDesignation || '',
            'COMPANY_SIGNATURE': signatureHtml,
            'REF_NO': applicant.refNo || `${type === 'appt' ? 'EMY/APT' : 'EMY/OFR'}/${(type === 'appt' ? company.apptCounter : company.offerCounter) || 1001}/${String(new Date(company.fyFrom || Date.now()).getFullYear()).slice(2)}-${String(new Date(company.fyTo || Date.now()).getFullYear()).slice(2)}`,
            'TODAY_DATE': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            'EMP_CODE': applicant.empCode || applicant.formData?.empCode || 'TBD'
        };

        const resolved = resolveTemplate(template, map);
        res.json({ success: true, resolved });
    } catch (e) {
        res.status(500).json({ error: 'Render failed' });
    }
});

router.post('/update-workflow-data', async (req, res) => {
    try {
        const { email, division, reportingTo, hq, empCode, refNo, salaryBreakup, verificationChecks, dob, actualJoiningDate, address, tasks, incrementData, fullName, phone, detailDesignation, detailHq, fatherName, gender, bloodGroup, maritalStatus,
                epfNumber, uanNumber, esiNumber, anniversaryDate, bankName, accNo, ifsc } = req.body;
        const update = {};
        if (division !== undefined) update.division = division;
        if (reportingTo !== undefined) update.reportingTo = reportingTo;
        if (hq !== undefined) update.hq = hq;
        if (detailHq !== undefined) update.hq = detailHq;
        if (empCode !== undefined) update.empCode = empCode;
        if (refNo !== undefined) update.refNo = refNo;
        if (dob !== undefined) update.dob = dob;
        if (actualJoiningDate !== undefined) update.actualJoiningDate = actualJoiningDate;
        if (address !== undefined) update.address = address;
        if (verificationChecks !== undefined) update.verificationChecks = verificationChecks;
        if (tasks !== undefined) update.tasks = tasks;
        if (incrementData !== undefined) update.incrementData = incrementData;

        // Editable profile fields
        if (fullName !== undefined) update.fullName = fullName;
        if (phone !== undefined) update.phone = phone;
        if (detailDesignation !== undefined) update.designation = detailDesignation;
        if (maritalStatus !== undefined) update.maritalStatus = maritalStatus;
        if (fatherName !== undefined) update['formData.fatherName'] = fatherName;
        if (gender !== undefined) update['formData.gender'] = gender;
        if (bloodGroup !== undefined) update['formData.bloodGroup'] = bloodGroup;

        // Statutory & bank fields (all optional — never error on blank)
        if (epfNumber !== undefined) update.epfNumber = epfNumber;
        if (uanNumber !== undefined) update.uanNumber = uanNumber;
        if (esiNumber !== undefined) update.esiNumber = esiNumber;
        if (anniversaryDate !== undefined) update.anniversaryDate = anniversaryDate;
        if (bankName !== undefined) update['formData.bankName'] = bankName;
        if (accNo !== undefined) update['formData.accNo'] = accNo;
        if (ifsc !== undefined) update['formData.ifsc'] = ifsc;

        if (salaryBreakup !== undefined) {
            const s = salaryBreakup;
            const basicVal = Number(s.basic || 0);

            // SAFETY: If basic is 0 or empty, skip salary validation entirely.
            // This happens for existing staff who have no salary set yet.
            if (basicVal > 0) {
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
            }
            update.salaryBreakup = s;
        }
        await Applicant.findOneAndUpdate({ email }, { $set: update });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/verify-and-activate', async (req, res) => {
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

        await Applicant.updateOne({ _id: applicant._id }, { $set: { status: 'approved', approvedAt: new Date(), verificationChecks, canLogin: true } });

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

router.post('/send-letter', async (req, res) => {
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

router.post('/save-letter-snapshot', async (req, res) => {
    try {
        const { email, letterType, letterData, notifyByEmail } = req.body; // letterData can be HTML/Text or Base64
        const update = { canLogin: true }; // Automatically ensure access when a letter is pushed to hub
        if (letterType === 'offer') update.offerLetterData = letterData;
        else if (letterType === 'appt') update.apptLetterData = letterData;

        const letterObj = {
            type: letterType,
            data: letterData,
            issuedAt: new Date()
        };

        await Applicant.findOneAndUpdate({ email }, { 
            $set: update,
            $push: { issuedLetters: letterObj }
        });

        if (notifyByEmail) {
            const applicant = await Applicant.findOne({ email });
            const company = await Company.findOne() || { name: 'Emyris Biolifesciences' };
            const label = letterType.toUpperCase().replace('_', ' ');

            await sendEmail({
                to: email,
                subject: `Important Document Update: ${label} - ${company.name}`,
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background: #6366f1; padding: 20px; text-align: center;">
                            <h2 style="color: white; margin: 0;">Document Notification</h2>
                        </div>
                        <div style="padding: 30px;">
                            <p>Dear ${applicant.fullName},</p>
                            <p>We are pleased to inform you that a new document has been issued and published to your official onboarding hub.</p>
                            <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
                                <strong>Document Type:</strong> ${label}<br>
                                <strong>Status:</strong> Published to Hub
                            </div>
                            <p>Please log in to the portal to view, download, or accept the document.</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${BASE_URL}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Portal</a>
                            </div>
                        </div>
                        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 0.8rem; color: #64748b;">
                            This is an automated notification from ${company.name}. Please do not reply to this email.
                        </div>
                    </div>
                `
            });
        }

        res.json({ success: true, message: `Letter saved to applicant hub${notifyByEmail ? ' and applicant notified' : ''}.` });
    } catch (e) { 
        console.error("Save snapshot error:", e);
        res.status(500).json({ error: 'Save failed' }); 
    }
});

router.get('/lifecycle-check', async (req, res) => {
    try {
        const applicants = await Applicant.find({
            offerAccepted: true,
            actualJoiningDate: { $exists: true }
        });

        const alerts = [];
        const now = new Date();

        applicants.forEach(app => {
            const parseDMY = (s) => {
                if (!s || typeof s !== 'string') return null;
                const parts = s.split('-');
                if (parts.length !== 3) return null;
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            };
            const adoj = parseDMY(app.actualJoiningDate) || new Date();
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

router.get('/asset-library', async (req, res) => {
    try {
        const assets = await Asset.find({ active: true }).sort({ uploadedAt: -1 }).lean();
        res.status(200).json(assets);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch library' }); }
});

router.post('/clean-duplicates', async (req, res) => {
    try {
        const apps = await Applicant.find({});
        let cleanedCount = 0;
        for (const a of apps) {
            if (!a.documents || !Array.isArray(a.documents)) continue;
            const seenCategories = new Set();
            const uniqueDocs = [];
            let modified = false;
            for (const doc of a.documents) {
                if (!seenCategories.has(doc.category)) {
                    seenCategories.add(doc.category);
                    uniqueDocs.push(doc);
                } else {
                    modified = true;
                }
            }
            if (modified) {
                await Applicant.updateOne({ _id: a._id }, { $set: { documents: uniqueDocs } });
                cleanedCount++;
            }
        }
        res.json({ success: true, cleanedCount });
    } catch (e) {
        console.error("Clean duplicates error:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/wipe-database', async (req, res) => {
    try {
        console.log("💥 [WIPE-DB] Wiping 100% of applicants, assets, and uploaded files for a fresh start...");
        if (Applicant.destroy) {
            await Applicant.destroy({ where: {}, truncate: true }).catch(() => {});
            await Asset.destroy({ where: {}, truncate: true }).catch(() => {});
            await TemplateHistory.destroy({ where: {}, truncate: true }).catch(() => {});
        } else {
            await Applicant.deleteMany({});
            await Asset.deleteMany({});
            await TemplateHistory.deleteMany({});
        }

        // Wipe /uploads/ folder
        const uploadsDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file !== '.gitkeep' && file !== 'README.md') {
                    try { fs.unlinkSync(path.join(uploadsDir, file)); } catch (e) {}
                }
            }
        }
        console.log("✅ [WIPE-DB] Database and uploads directory 100% wiped!");
        res.json({ success: true, message: "Entire database and uploaded files 100% wiped! Starting fresh!" });
    } catch (e) {
        console.error("Wipe DB Error:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/restore-legacy-db', async (req, res) => {
    try {
        console.log("🚀 [VPS-RESTORE] Starting full legacy restoration on live VPS database...");
        let restoredApps = 0;
        let restoredAssets = 0;

        // 1. Restore metadata from mongodb_backup_full.json
        const backupPath = path.join(__dirname, 'mongodb_backup_full.json');
        if (fs.existsSync(backupPath)) {
            const raw = fs.readFileSync(backupPath, 'utf8');
            const data = JSON.parse(raw);
            const apps = data.applicants || [];
            for (const app of apps) {
                delete app.__v;
                if (app._id && typeof app._id === 'object') app._id = app._id.$oid || app._id.toString();
                const existing = await Applicant.findOne({ email: app.email });
                if (existing) {
                    await Applicant.updateOne({ _id: existing._id }, { $set: app });
                } else {
                    await Applicant.create(app);
                }
                restoredApps++;
            }
            if (data.companies && data.companies.length > 0) {
                const comp = data.companies[0];
                delete comp.__v;
                if (comp._id && typeof comp._id === 'object') comp._id = comp._id.$oid || comp._id.toString();
                const existing = await Company.findOne({});
                if (existing) await Company.updateOne({ _id: existing._id }, { $set: comp });
                else await Company.create(comp);
            }
            if (data.divisions && data.divisions.length > 0) {
                for (const d of data.divisions) {
                    delete d.__v;
                    if (d._id && typeof d._id === 'object') d._id = d._id.$oid || d._id.toString();
                    const existing = await Division.findOne({ name: d.name });
                    if (!existing && d.name) await Division.create(d);
                }
            }
            if (data.hqs && data.hqs.length > 0) {
                for (const h of data.hqs) {
                    delete h.__v;
                    if (h._id && typeof h._id === 'object') h._id = h._id.$oid || h._id.toString();
                    const existing = await HQ.findOne({ name: h.name });
                    if (!existing && h.name) await HQ.create(h);
                }
            }
        }

        // 2. Restore heavy assets from MongoDB (both applicant files in emyris_assets and logos in emyris_db_assets)
        try {
            const { MongoClient } = require('mongodb');
            const MONGODB_URI = "mongodb://impdaysaap:RPykhDyaiPDFwSJi@ac-4mjmqyy-shard-00-00.cquys3i.mongodb.net:27017,ac-4mjmqyy-shard-00-01.cquys3i.mongodb.net:27017,ac-4mjmqyy-shard-00-02.cquys3i.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
            let mongoClient = new MongoClient(MONGODB_URI);
            await mongoClient.connect();
            
            const dbNames = ['emyris_assets', 'emyris_db_assets'];
            for (const dbName of dbNames) {
                const db = mongoClient.db(dbName);
                const cursor = db.collection('assets').find({});
                for await (const asset of cursor) {
                    const assetId = asset._id.toString();
                    const existing = await Asset.findById(assetId);
                    if (!existing) {
                        await Asset.create({
                            _id: assetId,
                            category: asset.category,
                            name: asset.name,
                            data: asset.data,
                            active: asset.active !== false,
                            uploadedAt: asset.uploadedAt ? new Date(asset.uploadedAt) : new Date()
                        });
                        restoredAssets++;
                    }
                }
            }
            await mongoClient.close();
        } catch (mongoErr) {
            console.error("Mongo Asset Restore Error:", mongoErr.message);
        }

        res.json({ success: true, message: `Restored ${restoredApps} applicants and ${restoredAssets} assets!` });
    } catch (err) {
        console.error("Restore Legacy DB Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/upload-asset', async (req, res) => {
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
                    await Company.updateOne({ _id: company._id }, { $set: { [field]: asset._id } });
                }
            }
        }
        res.json({ success: true, asset });
    } catch (e) {
        console.error('Asset upload error:', e);
        res.status(500).json({ error: 'Upload failed: ' + e.message });
    }
});

router.post('/delete-asset', async (req, res) => {
    try {
        const { assetId } = req.body;
        await Asset.findByIdAndUpdate(assetId, { active: false });

        // Remove from active pointers if it was the active one
        const company = await Company.findOne();
        if (company) {
            const keys = ['activeLogoId', 'activeStampId', 'activeSignatureId', 'activeLetterheadId'];
            const updates = {};
            let changed = false;
            keys.forEach(k => {
                if (company[k] === assetId) {
                    updates[k] = null;
                    changed = true;
                }
            });
            if (changed) {
                await Company.updateOne({ _id: company._id }, { $set: updates });
            }
        }

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
});

router.post('/set-active-asset', async (req, res) => {
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

        await Company.updateOne({ _id: company._id }, { $set: { [field]: assetId } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to set active asset' }); }
});

router.post('/add-category', async (req, res) => {
    try {
        const { categoryName } = req.body;
        if (!categoryName) return res.status(400).json({ error: 'Name required' });

        const company = await Company.findOne();
        if (!company) return res.status(404).json({ error: 'Company not found' });

        if (!company.customAssetCategories.includes(categoryName)) {
            const newCats = [...company.customAssetCategories, categoryName];
            await Company.updateOne({ _id: company._id }, { $set: { customAssetCategories: newCats } });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to add category' }); }
});

router.post('/delete-category', async (req, res) => {
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
            const newCats = company.customAssetCategories.filter(c => c !== categoryName);
            await Company.updateOne({ _id: company._id }, { $set: { customAssetCategories: newCats } });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to delete category' }); }
});

router.get('/system/export', async (req, res) => {
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

router.post('/system/import', async (req, res) => {
    try {
        const data = req.body;
        if (!data) return res.status(400).json({ error: 'No backup data provided' });

        let importedApps = 0;
        const apps = data.applicants || [];
        for (const app of apps) {
            delete app.__v;
            if (app._id && typeof app._id === 'object') app._id = app._id.$oid || app._id.toString();
            const existing = await Applicant.findOne({ email: app.email });
            if (existing) {
                await Applicant.updateOne({ _id: existing._id }, { $set: app });
            } else {
                await Applicant.create(app);
            }
            importedApps++;
        }

        if (data.company || (data.companies && data.companies.length > 0)) {
            const comp = data.company || data.companies[0];
            delete comp.__v;
            if (comp._id && typeof comp._id === 'object') comp._id = comp._id.$oid || comp._id.toString();
            const existComp = await Company.findOne({});
            if (existComp) {
                await Company.updateOne({ _id: existComp._id }, { $set: comp });
            } else {
                await Company.create(comp);
            }
        }

        if (data.divisions && Array.isArray(data.divisions)) {
            for (const d of data.divisions) {
                delete d.__v;
                if (d._id && typeof d._id === 'object') d._id = d._id.$oid || d._id.toString();
                const exist = await Division.findOne({ name: d.name });
                if (!exist && d.name) await Division.create(d);
            }
        }

        if (data.hqs && Array.isArray(data.hqs)) {
            for (const h of data.hqs) {
                delete h.__v;
                if (h._id && typeof h._id === 'object') h._id = h._id.$oid || h._id.toString();
                const exist = await HQ.findOne({ name: h.name });
                if (!exist && h.name) await HQ.create(h);
            }
        }

        res.json({ success: true, message: `Successfully restored ${importedApps} applicants and system configuration.` });
    } catch (e) {
        console.error('Import failed:', e);
        res.status(500).json({ error: 'Import failed: ' + e.message });
    }
});

router.post('/system/clear', async (req, res) => {
    try {
        const { includeSetup } = req.body;
        
        await Applicant.deleteMany({});
        // CASCADING DELETE: Remove all applicant documents from Asset DB
        await Asset.deleteMany({ category: { $regex: /^doc_/ } });
        
        if (includeSetup) {
            console.log("🧹 Total Wipeout: Clearing Divisions and HQs...");
            await Division.deleteMany({});
            await HQ.deleteMany({});
        }
        
        const company = await Company.findOne();
        if (company) {
            await Company.updateOne({ _id: company._id }, { $set: { offerCounter: 0, apptCounter: 0, miscCounter: 0, empCodeCounter: 0 } });
        }
        res.json({ success: true, message: 'Database cleared. ' + (includeSetup ? 'Divisions and HQs were also removed.' : '') });
    } catch (e) { 
        console.error("Nuke failed:", e);
        res.status(500).json({ error: 'Clear failed' }); 
    }
});

router.post('/delete-applicant', async (req, res) => {
    try {
        const { email } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        // Collect all assets linked to this applicant
        const filenames = (applicant.documents || [])
            .filter(d => d.assetId)
            .map(d => String(d.assetId).split('/').pop().trim());

        // 1. Delete Assets from Assets DB and physical files
        if (filenames.length > 0) {
            await Asset.deleteMany({ _id: { $in: filenames } });
            for (const fname of filenames) {
                const filePath = path.join(__dirname, 'uploads', fname);
                if (fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); } catch (e) {}
                }
            }
        }

        // 2. Delete Applicant from Main DB
        await Applicant.deleteOne({ email });

        res.json({ success: true, message: `Applicant ${email} and all linked assets deleted.` });
    } catch (e) {
        console.error('Delete error:', e);
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/system/vacuum', async (req, res) => {
    try {
        const company = await Company.findOne();
        const applicants = await Applicant.find();

        // 1. Collect all "In-Use" Asset IDs (clean filenames)
        const inUseIds = new Set();
        
        // From Company Branding
        if (company) {
            ['activeLogoId', 'activeStampId', 'activeSignatureId', 'activeLetterheadId'].forEach(key => {
                if (company[key]) {
                    const cleanId = String(company[key]).split('/').pop().trim();
                    if (cleanId) inUseIds.add(cleanId);
                }
            });
        }

        // From Applicant Documents
        applicants.forEach(app => {
            if (app.documents) {
                app.documents.forEach(doc => {
                    if (doc.assetId) {
                        const cleanId = String(doc.assetId).split('/').pop().trim();
                        if (cleanId) inUseIds.add(cleanId);
                    }
                });
            }
        });

        // 2. Delete Assets that are NOT in the inUse list
        const result = await Asset.deleteMany({
            _id: { $nin: Array.from(inUseIds) }
        });

        // 3. Clean up orphaned physical files from /uploads/ on disk
        let diskPruned = 0;
        const uploadsDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file !== '.gitkeep' && file !== 'README.md' && !inUseIds.has(file)) {
                    try {
                        fs.unlinkSync(path.join(uploadsDir, file));
                        diskPruned++;
                    } catch (e) {}
                }
            }
        }

        res.json({ 
            success: true, 
            message: `Vacuum complete. Pruned ${result.deletedCount || 0} unused database assets and ${diskPruned} orphaned disk files.`,
            stats: { prunedDB: result.deletedCount || 0, prunedDisk: diskPruned, kept: inUseIds.size }
        });
    } catch (e) { 
        console.error('Vacuum failure:', e);
        res.status(500).json({ error: 'Vacuum failed' }); 
    }
});

router.get('/applicants/:email', async (req, res) => {
    try {
        const applicant = await Applicant.findOne({ email: req.params.email });
        if (!applicant) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, applicant });
    } catch (e) { res.status(500).json({ success: false }); }
});

router.get('/pending-exams', async (req, res) => {
    try {
        const exams = await ExamResult.find().sort({ submittedAt: -1 });
        const questions = await Question.find();
        res.json({ success: true, exams, questions });
    } catch (e) {
        console.error('Fetch Pending Exams Error:', e);
        res.status(500).json({ error: 'Failed to fetch pending exams' });
    }
});

router.post('/grade-exam', async (req, res) => {
    try {
        const { examId, manualScore } = req.body;
        const exam = await ExamResult.findOne({ _id: examId });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        
        const total = (exam.autoScore || 0) + parseInt(manualScore || 0, 10);
        
        await ExamResult.updateOne({ _id: examId }, {
            $set: {
                manualScore: parseInt(manualScore || 0, 10),
                totalScore: total,
                status: 'graded'
            }
        });
        
        const company = await Company.findOne() || { name: 'Emyris Biolifesciences' };
        
        await sendEmail({
            to: exam.email,
            subject: `Your Exam Results are In! - ${company.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <h2 style="color: #6366f1;">Exam Graded</h2>
                    <p>Dear ${exam.name},</p>
                    <p>Your recent assessment for <strong>${exam.testedProduct}</strong> has been manually reviewed and graded by our Admin team.</p>
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0;">Your Score</h3>
                        <p style="margin: 0;"><strong>MCQ Auto-Score:</strong> ${exam.autoScore}</p>
                        <p style="margin: 5px 0 0 0;"><strong>Descriptive Manual Score:</strong> ${manualScore}</p>
                        <p style="margin: 5px 0 0 0; font-size: 1.2em; color: #6366f1;"><strong>Total Final Score: ${total} / ${exam.totalQuestions}</strong></p>
                    </div>
                    <p>You can review your detailed answers and performance by logging into the Applicant Portal and visiting the <strong>My Exam Scores</strong> tab.</p>
                    <br>
                    <p>Best regards,<br>The ${company.name} Team</p>
                </div>
            `
        });
        
        res.json({ success: true, totalScore: total });
    } catch (e) {
        console.error('Grade Exam Error:', e);
        res.status(500).json({ error: 'Failed to grade exam' });
    }
});

module.exports = router;
