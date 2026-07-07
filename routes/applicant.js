const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Company, Applicant, Question, ExamResult, Asset, EmailLog } = require('../db');

router.post('/login', async (req, res) => {
    try {
        try {
            const logMsg = `[${new Date().toISOString()}] LOGIN REQ: ${JSON.stringify(req.body)}\n`;
            fs.appendFileSync('login_debug.log', logMsg);
        } catch (logErr) {
            console.warn('⚠️ Log write failed:', logErr.message);
        }
        
        let { email, password, pin } = req.body;
        password = password || pin;
        // Hyper-robust cleaning (removes hidden chars, zero-width spaces, etc.)
        email = (email || "").toString().toLowerCase().trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
        password = (password || "").toString().trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
        
        // 1. Fetch applicant (try exact email or regex)
        let applicants = await Applicant.find({ email: email });
        if (!applicants || applicants.length === 0) {
            applicants = await Applicant.find({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
        }
        if (!applicants || applicants.length === 0) {
            // Ultimate fallback if query builder missed case
            applicants = await Applicant.find({});
        }
        
        // 2. Manual match to avoid regex/index quirks
        const applicant = applicants.find(a => {
            const dbPin = String(a.password || a.pin || "").trim();
            return a.email && a.email.toLowerCase().trim() === email && dbPin === password;
        });

        if (!applicant) {
            console.log(`❌ [LOGIN FAIL] ${email} / ${password}`);
            return res.status(401).json({ success: false, message: 'Invalid Email or PIN.' });
        }

        console.log(`✅ [LOGIN SUCCESS] Email: ${email}`);

        if (!applicant.canLogin) {
            // Special bypass for submitted/approved applicants so they can see their dashboard
            const allowedStages = ['submitted', 'approved', 'onboarding', 'joined'];
            if (!allowedStages.includes(applicant.status)) {
                let reason = "Your application is in a stage that does not require portal access.";
                if (applicant.status === 'rejected')   reason = "Your application was not accepted at this time. Please contact HR for details.";
                if (applicant.status === 'confirmed')  reason = "Your employment has been confirmed. Portal access is no longer required.";
                return res.status(403).json({ success: false, message: `Portal Notice: ${reason}` });
            }
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
                designation: applicant.designation,
                reportingTo: applicant.reportingTo,
                hq: applicant.hq,
                refNo: applicant.refNo,
                actualJoiningDate: applicant.actualJoiningDate,
                offerAccepted: applicant.offerAccepted,
                offerLetterData: applicant.offerLetterData,
                apptLetterData: applicant.apptLetterData,
                isExistingStaff: applicant.isExistingStaff,
                rapidTestCompleted: applicant.rapidTestCompleted
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login error.' });
    }
});

router.get('/test-questions', async (req, res) => {
    try {
        const company = await Company.findOne();
        let questions = await Question.find({ active: true });
        if (company && company.activeExamProduct && company.activeExamProduct !== 'General') {
            questions = questions.filter(q => q.targetProduct === company.activeExamProduct || q.category !== 'exam_product');
        }
        const cats = ['math', 'english', 'current_affairs', 'gk'];
        let selected = [];
        cats.forEach(c => {
            const catQs = questions.filter(q => q.category === c);
            const shuffled = catQs.sort(() => 0.5 - Math.random());
            selected.push(...shuffled.slice(0, 5));
        });
        
        // Send correctAnswerIndex for educational real-time feedback
        const safeQuestions = selected.map(q => ({
            _id: q._id,
            category: q.category,
            text: q.text,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex
        }));
        
        // Shuffle the final 20 questions so they aren't grouped by category
        res.json({ success: true, questions: safeQuestions.sort(() => 0.5 - Math.random()) });
    } catch (e) {
        console.error('Fetch Test Error:', e);
        res.status(500).json({ error: 'Failed to fetch test' });
    }
});

app.post('/api/applicant/submit-test', async (req, res) => {
    try {
        const { email, answers } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
        
        if (applicant.rapidTestCompleted) {
            return res.status(400).json({ error: 'Test already completed' });
        }

        let score = 0;
        const questions = await Question.find({ active: true });
        
        for (const [qId, selectedIdx] of Object.entries(answers || {})) {
            const q = questions.find(qu => qu._id === qId);
            if (q && q.correctAnswerIndex === Number(selectedIdx)) {
                score++;
            }
        }
        
        await Applicant.updateOne({ _id: applicant._id }, { $set: { rapidTestScore: score, rapidTestCompleted: true } });
        
        res.json({ success: true, score });
    } catch (e) {
        console.error('Submit Test Error:', e);
        res.status(500).json({ error: 'Failed to submit test' });
    }
});

// Admin Question Bank
app.get('/api/admin/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json({ success: true, questions });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/admin/questions', async (req, res) => {
    try {
        await Question.create(req.body);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/questions/:id', async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/questions/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ error: 'Not found' });
        
        await Question.updateOne({ _id: question._id }, { $set: req.body });
        res.json({ success: true });
    } catch (e) {
        console.error('Update Question Error:', e);
        res.status(500).json({ error: 'Failed' });
    }
});

// --- ONGOING EXAM APIs ---
app.post('/api/admin/schedule-exam', async (req, res) => {
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

app.post('/api/applicant/exam-questions', async (req, res) => {
    try {
        const company = await Company.findOne();
        const activeProduct = company && company.activeExamProduct ? company.activeExamProduct : '';
        const mcqTime = company && company.examMcqTime ? company.examMcqTime : 15;
        const descTime = company && company.examDescriptiveTime ? company.examDescriptiveTime : 15;
        const mcqCount = company && company.examMcqCount ? company.examMcqCount : 10;
        
        const questions = await Question.find({ active: true });
        
        // ONLY fetch Product questions
        let allProductQs = questions.filter(q => 
            q.category === 'exam_product' || 
            (activeProduct && q.targetProduct === activeProduct) || 
            (activeProduct && q.category.toLowerCase() === activeProduct.toLowerCase()) ||
            q.category.toLowerCase() === 'emystein' // Fallback for legacy DB structure
        );
        
        // Strict slice for MCQ based on mcqCount, NO slice for Descriptive
        let mcqProductQs = allProductQs.filter(q => q.questionType === 'mcq').sort(() => 0.5 - Math.random()).slice(0, mcqCount);
        let descProductQs = allProductQs.filter(q => q.questionType === 'descriptive').sort(() => 0.5 - Math.random()).slice(0, 5);
        
        // Combine and shuffle
        const selected = [...mcqProductQs, ...descProductQs].sort(() => 0.5 - Math.random());
        
        const safeQuestions = selected.map(q => ({
            _id: q._id,
            category: q.category,
            questionType: q.questionType,
            text: q.text,
            options: q.options,
            inputFields: q.inputFields,
            correctAnswerIndex: q.correctAnswerIndex
        }));
        
        res.json({ success: true, mcqTime, descTime, questions: safeQuestions });
    } catch (e) {
        console.error('Fetch Exam Error:', e);
        res.status(500).json({ error: 'Failed to fetch exam questions' });
    }
});

app.post('/api/applicant/submit-exam', async (req, res) => {
    try {
        const { email, name, hq, division, examDate, answers, totalQuestions } = req.body;
        
        let autoScore = 0;
        const questions = await Question.find({ active: true });
        
        for (const [qId, selectedIdxOrText] of Object.entries(answers || {})) {
            const q = questions.find(qu => qu._id === qId);
            if (q && q.questionType === 'mcq' && q.correctAnswerIndex === Number(selectedIdxOrText)) {
                autoScore++;
            }
        }
        
        await ExamResult.create({
            email,
            name,
            hq,
            division,
            examDate,
            totalQuestions,
            autoScore,
            manualScore: 0,
            totalScore: autoScore,
            status: 'pending_review',
            answers
        });
        
        res.json({ success: true });
    } catch (e) {
        console.error('Submit Exam Error:', e);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});

app.get('/api/admin/exam-reports', async (req, res) => {
    try {
        const results = await ExamResult.find();
        res.json({ success: true, results });
    } catch (e) {
        console.error('Fetch Exam Reports Error:', e);
        res.status(500).json({ error: 'Failed' });
    }
});


// --- APPLICANT DOCUMENT UPLOAD ---
// Save Progress (Draft)
app.post('/api/applicant/save-draft', async (req, res) => {
    try {
        const { email, formData } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email' });

        const parseDMY = (s) => {
            if (!s || typeof s !== 'string') return null;
            if (s.includes('T')) return new Date(s); // Already ISO
            const parts = s.split('-');
            if (parts.length !== 3) return null;
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        };

        const updateData = {
            formData,
            hq: formData.hq,
            actualJoiningDate: formData.joiningDate, // Store as string DD-MM-YYYY
            dob: formData.dob, // Store as string DD-MM-YYYY
            address: formData.address || "",
            pin: formData.pin || "",
            state: formData.state || "",
            salary: formData.salary || "",
            maritalStatus: formData.maritalStatus || "",
            anniversaryDate: formData.maritalStatus === 'Married' ? `${formData.anniversaryDay}-${formData.anniversaryMonth}` : "",
            epfNumber: formData.epfNumber || "",
            uanNumber: formData.uanNumber || "",
            esiNumber: formData.esiNumber || ""
        };

        if (formData.firstName || formData.lastName) {
            updateData.fullName = `${formData.firstName || ""} ${formData.middleName || ""} ${formData.lastName || ""}`.trim();
        }
        if (formData.phone) {
            updateData.phone = formData.phone;
        }

        await Applicant.findOneAndUpdate(
            { email },
            updateData
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Accept Offer & Submit ADOJ


// In-memory mutex for preventing race conditions during simultaneous document uploads
const documentUploadLocks = {};

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

        // 1. Save to Local File System instead of Asset DB
        const fileUrl = saveBase64ToFile(email, category, fileData);

        // 2. Link metadata in Applicant (WITHOUT the heavy data)
        const docMetadata = {
            category,
            name: fileName,
            assetId: fileUrl, // Save the path string in assetId for legacy compatibility
            sizeKB,
            uploadedAt: new Date()
        };

        // Acquire Mutex Lock for this email to prevent simultaneous upload race conditions
        while (documentUploadLocks[email]) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        documentUploadLocks[email] = true;

        try {
            // Fresh read inside the lock to ensure we have the absolute latest array
            const currentApplicant = await Applicant.findOne({ email });
            let docs = currentApplicant.documents || [];
            
            // Convert to array if it's somehow a string (Sequelize JSON fallback)
            if (typeof docs === 'string') {
                try { docs = JSON.parse(docs); } catch (e) { docs = []; }
            }

            // The isMulti restriction has been removed. 
            // All categories now support multiple files (e.g. Front & Back uploads for Aadhar/PAN).
            // Append the new document
            docs.push(docMetadata);

            // Save back to DB atomically
            await Applicant.updateOne({ email }, { $set: { documents: docs } });
        } finally {
            // Release Mutex Lock
            delete documentUploadLocks[email];
        }

        console.log(`Γ£à [DOC] Local Upload: ${category} for ${email} saved to ${fileUrl}`);

        res.status(200).json({ 
            success: true, 
            message: `${category} uploaded successfully`,
            assetId: fileUrl 
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

// BULK ADD EXISTING STAFF
app.post('/api/admin/bulk-add-existing-staff', async (req, res) => {
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

app.get('/api/admin/applicants', async (req, res) => {
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

router.post('/submit-test', async (req, res) => {
    try {
        const { email, answers } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
        
        if (applicant.rapidTestCompleted) {
            return res.status(400).json({ error: 'Test already completed' });
        }

        let score = 0;
        const questions = await Question.find({ active: true });
        
        for (const [qId, selectedIdx] of Object.entries(answers || {})) {
            const q = questions.find(qu => qu._id === qId);
            if (q && q.correctAnswerIndex === Number(selectedIdx)) {
                score++;
            }
        }
        
        await Applicant.updateOne({ _id: applicant._id }, { $set: { rapidTestScore: score, rapidTestCompleted: true } });
        
        res.json({ success: true, score });
    } catch (e) {
        console.error('Submit Test Error:', e);
        res.status(500).json({ error: 'Failed to submit test' });
    }
});

router.post('/exam-questions', async (req, res) => {
    try {
        const company = await Company.findOne();
        const activeProduct = company && company.activeExamProduct ? company.activeExamProduct : '';
        const mcqTime = company && company.examMcqTime ? company.examMcqTime : 15;
        const descTime = company && company.examDescriptiveTime ? company.examDescriptiveTime : 15;
        const mcqCount = company && company.examMcqCount ? company.examMcqCount : 10;
        
        const questions = await Question.find({ active: true });
        
        // ONLY fetch Product questions
        let allProductQs = questions.filter(q => 
            q.category === 'exam_product' || 
            (activeProduct && q.targetProduct === activeProduct) || 
            (activeProduct && q.category.toLowerCase() === activeProduct.toLowerCase()) ||
            q.category.toLowerCase() === 'emystein' // Fallback for legacy DB structure
        );
        
        // Strict slice for MCQ based on mcqCount, NO slice for Descriptive
        let mcqProductQs = allProductQs.filter(q => q.questionType === 'mcq').sort(() => 0.5 - Math.random()).slice(0, mcqCount);
        let descProductQs = allProductQs.filter(q => q.questionType === 'descriptive').sort(() => 0.5 - Math.random()).slice(0, 5);
        
        // Combine and shuffle
        const selected = [...mcqProductQs, ...descProductQs].sort(() => 0.5 - Math.random());
        
        const safeQuestions = selected.map(q => ({
            _id: q._id,
            category: q.category,
            questionType: q.questionType,
            text: q.text,
            options: q.options,
            inputFields: q.inputFields,
            correctAnswerIndex: q.correctAnswerIndex
        }));
        
        res.json({ success: true, mcqTime, descTime, questions: safeQuestions });
    } catch (e) {
        console.error('Fetch Exam Error:', e);
        res.status(500).json({ error: 'Failed to fetch exam questions' });
    }
});

router.post('/submit-exam', async (req, res) => {
    try {
        const { email, name, hq, division, examDate, answers, totalQuestions } = req.body;
        
        let autoScore = 0;
        const questions = await Question.find({ active: true });
        
        for (const [qId, selectedIdxOrText] of Object.entries(answers || {})) {
            const q = questions.find(qu => qu._id === qId);
            if (q && q.questionType === 'mcq' && q.correctAnswerIndex === Number(selectedIdxOrText)) {
                autoScore++;
            }
        }
        
        await ExamResult.create({
            email,
            name,
            hq,
            division,
            examDate,
            totalQuestions,
            autoScore,
            manualScore: 0,
            totalScore: autoScore,
            status: 'pending_review',
            answers
        });
        
        res.json({ success: true });
    } catch (e) {
        console.error('Submit Exam Error:', e);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});

router.post('/save-draft', async (req, res) => {
    try {
        const { email, formData } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email' });

        const parseDMY = (s) => {
            if (!s || typeof s !== 'string') return null;
            if (s.includes('T')) return new Date(s); // Already ISO
            const parts = s.split('-');
            if (parts.length !== 3) return null;
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        };

        const updateData = {
            formData,
            hq: formData.hq,
            actualJoiningDate: formData.joiningDate, // Store as string DD-MM-YYYY
            dob: formData.dob, // Store as string DD-MM-YYYY
            address: formData.address || "",
            pin: formData.pin || "",
            state: formData.state || "",
            salary: formData.salary || "",
            maritalStatus: formData.maritalStatus || "",
            anniversaryDate: formData.maritalStatus === 'Married' ? `${formData.anniversaryDay}-${formData.anniversaryMonth}` : "",
            epfNumber: formData.epfNumber || "",
            uanNumber: formData.uanNumber || "",
            esiNumber: formData.esiNumber || ""
        };

        if (formData.firstName || formData.lastName) {
            updateData.fullName = `${formData.firstName || ""} ${formData.middleName || ""} ${formData.lastName || ""}`.trim();
        }
        if (formData.phone) {
            updateData.phone = formData.phone;
        }

        await Applicant.findOneAndUpdate(
            { email },
            updateData
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/upload-document', async (req, res) => {
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

        // 1. Save to Local File System instead of Asset DB
        const fileUrl = saveBase64ToFile(email, category, fileData);

        // 2. Link metadata in Applicant (WITHOUT the heavy data)
        const docMetadata = {
            category,
            name: fileName,
            assetId: fileUrl, // Save the path string in assetId for legacy compatibility
            sizeKB,
            uploadedAt: new Date()
        };

        // Acquire Mutex Lock for this email to prevent simultaneous upload race conditions
        while (documentUploadLocks[email]) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        documentUploadLocks[email] = true;

        try {
            // Fresh read inside the lock to ensure we have the absolute latest array
            const currentApplicant = await Applicant.findOne({ email });
            let docs = currentApplicant.documents || [];
            
            // Convert to array if it's somehow a string (Sequelize JSON fallback)
            if (typeof docs === 'string') {
                try { docs = JSON.parse(docs); } catch (e) { docs = []; }
            }

            // The isMulti restriction has been removed. 
            // All categories now support multiple files (e.g. Front & Back uploads for Aadhar/PAN).
            // Append the new document
            docs.push(docMetadata);

            // Save back to DB atomically
            await Applicant.updateOne({ email }, { $set: { documents: docs } });
        } finally {
            // Release Mutex Lock
            delete documentUploadLocks[email];
        }

        console.log(`Γ£à [DOC] Local Upload: ${category} for ${email} saved to ${fileUrl}`);

        res.status(200).json({ 
            success: true, 
            message: `${category} uploaded successfully`,
            assetId: fileUrl 
        });
    } catch (error) {
        console.error('Γ¥î Document upload error:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

router.post('/accept-offer', async (req, res) => {
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

router.post('/delete-document', async (req, res) => {
    try {
        const { email, assetId, category } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Not found' });

        // 1. Remove from Document Array
        const targetId = String(assetId || '').trim();
        applicant.documents = (applicant.documents || []).filter(d => {
            const dId = String(d.assetId || d._id || d.id || '').trim();
            return dId !== targetId;
        });

        // 2. Delete from Asset DB and Local File System
        const cleanFilename = String(assetId || '').split('/').pop().trim();
        if (cleanFilename) {
            const filePath = path.join(__dirname, 'uploads', cleanFilename);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) {}
            }
            if (Asset.findByIdAndDelete) {
                await Asset.findByIdAndDelete(cleanFilename).catch(() => {});
            } else {
                await Asset.destroy({ where: { _id: cleanFilename } }).catch(() => {});
            }
        }

        // 3. Reset verification for this category if it was the last file? 
        // Or just reset always to be safe.
        const checks = { ...(applicant.verificationChecks || {}) };
        if (checks[category]) {
            delete checks[category];
        }
        await Applicant.updateOne({ _id: applicant._id }, { $set: { documents: applicant.documents, verificationChecks: checks } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
});

router.post('/resubmit-document', async (req, res) => {
    try {
        const { email, category, data, name } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        // Save Base64 to disk
        const fileUrl = saveBase64ToFile(email, category, data);

        // Remove old document of same category
        const newDocs = (applicant.documents || []).filter(d => d.category !== category);
        
        // Add new, storing the URL instead of base64
        newDocs.push({ category, assetId: fileUrl, name, uploadedAt: new Date() });
        
        // Reset verification status
        const checks = { ...(applicant.verificationChecks || {}) };
        if (checks[category]) {
            delete checks[category];
        }
        
        await Applicant.updateOne({ _id: applicant._id }, { $set: { documents: newDocs, verificationChecks: checks } });
        const updatedApp = await Applicant.findOne({ email });
        res.json({ success: true, message: 'Document resubmitted successfully.', assetId: fileUrl, applicant: updatedApp });
    } catch (e) {
        console.error('Resubmit error:', e);
        res.status(500).json({ error: 'Resubmission failed' });
    }
});

router.get('/my-scores/:email', async (req, res) => {
    try {
        const exams = await ExamResult.find({ email: req.params.email }).sort({ submittedAt: -1 });
        const questions = await Question.find();
        res.json({ success: true, exams, questions });
    } catch (e) {
        console.error('Fetch My Scores Error:', e);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

module.exports = router;
