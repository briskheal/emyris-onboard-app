const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { XlDivision, XlDesignation, XlUser, XlAdmin, XlState, XlHQ, XlCity, XlRoute, XlTarget, Company, Applicant, Question, ExamResult, Asset, Division, HQ, TemplateHistory, Payslip, LeaveType, LeaveBalance, LeaveRequest, LoanType, AssignedLoan, AssignedAdvance, sequelize } = require('../db');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const xlsx = require('xlsx');

const uploadAttendance = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(__dirname, '../Attendance/');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => cb(null, 'LATEST_ATTENDANCE.xlsx')
    })
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const BASE_URL = process.env.BASE_URL || 'https://emyrishr.in';

const { sendEmail } = require('../utils/mailer');
const { numberToWords, resolveTemplate } = require('../utils/templateHelpers');
const { purgeApplicantAndAllAssociatedRecords } = require('../utils/applicantPurge');
const { runBirthdayCron } = require('../utils/cron');
const sharp = require('sharp');

// Endpoint to force restart the server
router.get('/restart', (req, res) => {
    console.log('Restart triggered via browser link.');
    res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 20vh; background: #0f172a; color: white; padding: 50px; border-radius: 12px; height: 100vh;">
        <h2 style="color: #10b981;">Server is restarting...</h2>
        <p style="color: #94a3b8;">Please wait 5 seconds and navigate back to the admin portal.</p>
      </div>
    `);
    setTimeout(() => {
        process.exit(1);
    }, 500);
});

// Shared file helper (Converts images to WebP using sharp; leaves PDF documents intact)
async function saveBase64ToFile(email, category, base64Data) {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:')) {
        return base64Data;
    }
    try {
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) return base64Data;
        const mimeType = matches[1].toLowerCase();
        let ext = matches[1].split('/')[1] || 'bin';
        const dir = path.join(__dirname, '..', 'uploads', email.replace('@', '_'));
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const safeCategory = category.replace(/[\/\\]/g, '_');
        
        let buffer = Buffer.from(matches[2], 'base64');
        
        if (mimeType.startsWith('image/') && !mimeType.includes('svg') && !mimeType.includes('icon')) {
            try {
                buffer = await sharp(buffer)
                    .webp({ quality: 80, effort: 4 })
                    .toBuffer();
                ext = 'webp';
            } catch (sharpErr) {
                console.warn('[SHARP CONVERSION WARNING] Could not convert image to WebP, saving original:', sharpErr.message);
            }
        }
        
        const filename = `${safeCategory}_${Date.now()}.${ext}`;
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, buffer);
        return `/uploads/${email.replace('@', '_')}/${filename}`;
    } catch (e) {
        console.error('[FILE SAVE ERROR]', e.message);
        return base64Data;
    }
}

// Shared date helper
function safeParseDateServer(s) {
    if (!s || typeof s !== 'string') return null;
    if (s.includes('T')) return new Date(s);
    const parts = s.split('-');
    if (parts.length !== 3) return null;
    if (parts[0].length === 4) return new Date(s);
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
}


// You may need to port upload middleware and other shared utilities here.

router.get('/uploads/*', async (req, res) => {
    try {
        const subpath = decodeURIComponent(req.params[0]);
        const filePath = path.join(__dirname, '..', 'uploads', subpath);
        const filename = path.basename(subpath);
        
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
            res.send(asset.data);
        } else {
            res.status(404).send('File not found');
        }
    } catch (error) {
        res.status(500).send('Error accessing file');
    }
});

// GET /api/admin/company - for Settings page
router.get('/company', async (req, res) => {
    try {
        const company = await Company.findOne();
        if (company) {
            // Strip heavy HTML template bodies for the main profile endpoint
            let optimizedCompany = company;
            if (typeof company.toObject === 'function') optimizedCompany = company.toObject();
            else if (company.dataValues) optimizedCompany = company.dataValues;
            else optimizedCompany = { ...company }; // Fallback for raw JSON objects
            
            delete optimizedCompany.offerLetterBody;
            delete optimizedCompany.apptLetterBody;
            delete optimizedCompany.confirmLetterBody;
            delete optimizedCompany.revisedSalaryBody;
            delete optimizedCompany.incentiveCircularBody;
            res.json({ success: true, company: optimizedCompany });
        } else {
            res.json({ success: true, company: {} });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/admin/company/letters - for Setup & Letters page
router.get('/company/letters', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        const company = await Company.findOne();
        if (company) {
            res.json({ 
                success: true, 
                offerLetterBody: company.offerLetterBody || '',
                apptLetterBody: company.apptLetterBody || '',
                confirmLetterBody: company.confirmLetterBody || '',
                confirmDelayedLetterBody: company.confirmDelayedLetterBody || '',
                revisedSalaryBody: company.revisedSalaryBody || '',
                experienceLetterBody: company.experienceLetterBody || '',
                relievingLetterBody: company.relievingLetterBody || '',
                warningLetterBody: company.warningLetterBody || '',
                showCauseLetterBody: company.showCauseLetterBody || '',
                incentiveCircularBody: company.incentiveCircularBody || ''
            });
        } else {
            res.json({ success: true });
        }
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

router.put('/questions/:id', async (req, res) => {
    try {
        await Question.updateOne({ _id: req.params.id }, req.body);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.delete('/questions/:id', async (req, res) => {
    try {
        await Question.deleteOne({ _id: req.params.id });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.delete('/target-product/:prod', async (req, res) => {
    try {
        const prod = decodeURIComponent(req.params.prod);
        if (prod === 'General') return res.status(400).json({ error: 'Cannot delete General category' });
        
        const allCompanies = await Company.find();
        for (const company of allCompanies) {
            if (company && Array.isArray(company.targetProductsList)) {
                const updatedList = company.targetProductsList.filter(p => p !== prod && p.toLowerCase() !== prod.toLowerCase());
                await Company.updateOne({ _id: company._id }, { targetProductsList: updatedList, $set: { targetProductsList: updatedList } });
            }
        }
        
        // Also delete all questions associated with this target product or category (case-insensitive)
        const allQuestions = await Question.find();
        for (const q of allQuestions) {
            if ((q.targetProduct && q.targetProduct.toLowerCase() === prod.toLowerCase()) ||
                (q.category && q.category.toLowerCase() === prod.toLowerCase())) {
                await q.destroy();
            }
        }
        
        res.json({ success: true, message: `Deleted ${prod} and all associated questions.` });
    } catch (e) {
        console.error('Target product deletion error:', e);
        res.status(500).json({ success: false, error: 'Failed to delete target product' });
    }
});


router.post('/schedule-exam', async (req, res) => {
    try {
        const { examDate, targetProduct, mcqTime, descTime, mcqCount, rapidTime } = req.body;

        if (!examDate || !targetProduct) return res.status(400).json({ error: 'Missing required fields' });
        const company = await Company.findOne();
        if (company) {
            await Company.updateOne({ _id: company._id }, { 
                $set: { 
                    activeExamDate: examDate, 
                    activeExamProduct: targetProduct || '',
                    examMcqTime: mcqTime || 15,
                    examDescriptiveTime: descTime || 15,
                    examMcqCount: mcqCount || 5,
                    rapidTestTime: rapidTime || 25
                } 
            });

            // Queue exam to eligible applicants
            const applicants = await Applicant.find({ status: { $nin: ['rejected'] } });
            const productName = targetProduct || 'General Assessment';
            
            const newExam = {
                id: Date.now().toString(),
                examDate,
                targetProduct: productName,
                mcqTime: mcqTime || 15,
                descTime: descTime || 15,
                mcqCount: mcqCount || 5,
                rapidTime: rapidTime || 25,
                assignedAt: new Date().toISOString()
            };

            for (const app of applicants) {
                let currentPending = [];
                try {
                    currentPending = typeof app.pendingExams === 'string' ? JSON.parse(app.pendingExams) : (app.pendingExams || []);
                } catch(e) { currentPending = []; }
                
                const alreadyQueued = currentPending.find(e => e.examDate === examDate && e.targetProduct === productName);
                const existingResult = await ExamResult.findOne({ email: app.email, testedProduct: productName });

                if (!alreadyQueued && !existingResult) {
                    currentPending.push(newExam);
                    await Applicant.updateOne({ _id: app._id }, { $set: { pendingExams: currentPending } });
                    
                    try {
                        const emailHtml = `
                            <h2>Exam Scheduled: ${productName}</h2>
                            <p>Hi ${app.fullName},</p>
                            <p>Your MCQ Questionnaire for <strong>${productName}</strong> has been uploaded to your dashboard.</p>
                            <p>Please log in and complete it as soon as possible. The exam date is set for ${examDate}.</p>
                            <p><a href="${BASE_URL}/" style="padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 5px;">Login to Dashboard</a></p>
                        `;
                        await sendEmail({
                            to: app.email,
                            subject: `Action Required: Exam Scheduled for ${productName}`,
                            html: emailHtml
                        });
                    } catch (err) {
                        console.error('Failed to notify applicant:', app.email, err.message);
                    }
                }
            }

            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (e) {
        console.error('Schedule Exam Error:', e);
        res.status(500).json({ error: 'Failed to schedule exam' });
    }
});

// Auto-heal route to fix rapidTestScore bug
router.get('/heal-scores', async (req, res) => {
    try {
        const applicants = await Applicant.find({ rapidTestCompleted: true });
        let healedCount = 0;
        let details = [];
        for (const app of applicants) {
            const rapidExam = await ExamResult.findOne({ email: app.email, testedProduct: { $regex: /Rapid Fire/i } });
            if (rapidExam && rapidExam.autoScore !== app.rapidTestScore) {
                await Applicant.updateOne({ _id: app._id }, { $set: { rapidTestScore: rapidExam.autoScore } });
                details.push(`${app.email}: changed from ${app.rapidTestScore} to ${rapidExam.autoScore}`);
                healedCount++;
            }
        }
        res.json({ success: true, healedCount, details });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/exam-reports', async (req, res) => {
    try {
        let results = await ExamResult.find();
        
        // Auto-heal legacy glued scores before sending to UI
        let needsSave = false;
        results = results.map(r => {
            let aScore = parseInt(r.autoScore, 10) || 0;
            let mScore = parseInt(r.manualScore, 10) || 0;
            let tScoreStr = String(r.totalScore);
            
            // Check if string concatenation glued the numbers (e.g. '98' instead of 17)
            if (tScoreStr === String(aScore) + String(mScore)) {
                r.totalScore = aScore + mScore;
                needsSave = true;
            } else if (typeof r.totalScore === 'string' || typeof r.autoScore === 'string') {
                // Ensure integer types
                r.autoScore = aScore;
                r.manualScore = mScore;
                r.totalScore = aScore + mScore;
                needsSave = true;
            }
            
            // Also ensure totalQuestions is properly parsed
            if (typeof r.totalQuestions === 'string') {
                r.totalQuestions = parseInt(r.totalQuestions, 10) || 20;
                needsSave = true;
            }
            return r;
        });
        
        // Dynamically calculate mcqTotal and descTotal for legacy records based on current questions
        const questions = await Question.find();

        // Build a global question lookup map: { [_id]: { text, options, correctAnswerIndex, questionType } }
        // This allows the frontend breakdown view to show real question text instead of raw DB IDs
        const questionMap = {};
        questions.forEach(q => {
            const qObj = q.toObject ? q.toObject() : q;
            questionMap[String(qObj._id)] = {
                text: qObj.text || qObj.question || '',
                options: qObj.options || [],
                correctAnswerIndex: qObj.correctAnswerIndex !== undefined ? qObj.correctAnswerIndex : qObj.correctAnswer,
                questionType: qObj.questionType || 'mcq'
            };
        });

        results = results.map(r => {
            r = r.toObject ? r.toObject() : r;
            if (!r.mcqTotal && !r.descTotal && r.testedProduct) {
                let mcqCount = 0;
                let descCount = 0;
                const examQs = questions.filter(q => q.targetProduct === r.testedProduct);
                examQs.forEach(q => {
                    if (q.questionType === 'mcq') mcqCount++;
                    else descCount++;
                });
                
                if (mcqCount === 0 && descCount === 0 && r.totalQuestions > 0) {
                    mcqCount = r.totalQuestions; // fallback assumption
                }
                
                r.mcqTotal = mcqCount;
                r.descTotal = descCount;
                needsSave = true;
            }
            // Attach questionMap to every result so frontend can resolve IDs → question text
            r.questionMap = questionMap;
            return r;
        });

        // In the background, try to repair the DB records
        if (needsSave) {
            Promise.all(results.map(r => {
                if (typeof r.totalScore === 'number' && typeof r.autoScore === 'number') {
                    const updateDoc = {
                        autoScore: r.autoScore,
                        manualScore: r.manualScore,
                        totalScore: r.totalScore,
                        totalQuestions: r.totalQuestions
                    };
                    if (r.mcqTotal !== undefined) updateDoc.mcqTotal = r.mcqTotal;
                    if (r.descTotal !== undefined) updateDoc.descTotal = r.descTotal;
                    
                    return ExamResult.updateOne({ _id: r._id }, { $set: updateDoc });
                }
            })).catch(e => console.error("Auto-heal DB save failed:", e));
        }

        res.json({ success: true, results });
    } catch (e) {
        console.error('Fetch Exam Reports Error:', e);
        res.status(500).json({ error: 'Failed' });
    }
});

// Manual trigger for Birthday Cron Job
router.get('/force-birthday-cron', async (req, res) => {
    try {
        const result = await runBirthdayCron();
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    console.log(`[LOGIN ATTEMPT] username: ${req.body.username}`);
    const { username, password } = req.body;
    const adminUser = (process.env.ADMIN_USER || 'EMYRIS@BIOLIFE').toUpperCase();
    const adminPass = process.env.ADMIN_PASS || 'Omrutam@1306';
    const subAdminUser = (process.env.SUBADMIN_USER || 'ADMIN2').toUpperCase();
    const subAdminPass = process.env.SUBADMIN_PASS || '1234';

    if (username && username.toUpperCase() === adminUser && password === adminPass) {
        console.log(`[LOGIN SUCCESS] ${req.body.username} (superadmin)`);
        res.status(200).json({ success: true, role: 'superadmin' });
    } else if (username && username.toUpperCase() === subAdminUser && password === subAdminPass) {
        console.log(`[LOGIN SUCCESS] ${req.body.username} (subadmin)`);
        res.status(200).json({ success: true, role: 'subadmin' });
    } else {
        console.log(`[LOGIN FAILED] ${req.body.username}`);
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


router.post('/upload-applicant-doc', async (req, res) => {
    try {
        const { email, category, base64Data, fileName } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

        // Reuse the server.js saveBase64ToFile helper logic or implement locally
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return res.status(400).json({ success: false, message: 'Invalid file data' });
        
        const mimeType = matches[1].toLowerCase();
        let ext = 'png';
        if (mimeType.includes('pdf')) ext = 'pdf';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('jpeg') || mimeType.includes('jpg') || mimeType.includes('jfif')) ext = 'jpg';
        else if (fileName && fileName.includes('.')) ext = fileName.split('.').pop();

        const safeEmail = email.replace(/[^a-z0-9]/gi, '_');
        const safeCategory = category.replace(/[^a-z0-9]/gi, '_');
        
        const uploadsDir = require('path').join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        let buffer = Buffer.from(matches[2], 'base64');
        if (mimeType.startsWith('image/') && !mimeType.includes('svg') && !mimeType.includes('icon')) {
            try {
                buffer = await sharp(buffer).webp({ quality: 80, effort: 4 }).toBuffer();
                ext = 'webp';
            } catch (sharpErr) {
                console.warn('[SHARP CONVERSION WARNING] Could not convert admin image to WebP, saving original:', sharpErr.message);
            }
        }

        const savedFilename = `${safeEmail}_${safeCategory}_${Date.now()}.${ext}`;
        fs.writeFileSync(require('path').join(uploadsDir, savedFilename), buffer);

        // Asynchronously save to PostgreSQL Asset database as backup against Docker volume wipes
        Asset.create({
            _id: savedFilename,
            category: `doc_${safeCategory}`,
            name: savedFilename,
            data: base64Data
        }).catch(e => console.error('Asset backup failed:', e));

        // Update applicant DB
        const newDoc = { docType: category, category, filename: `/api/admin/uploads/${savedFilename}`, uploadedAt: new Date() };
        await Applicant.updateOne(
            { email },
            { $push: { documents: newDoc } }
        );

        res.json({ success: true, message: 'Uploaded successfully', doc: newDoc });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
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
            password: portalPin,
            status: 'approved',
            isExistingStaff: true,
            canLogin: true,
            rapidTestCompleted: false, // Require rapid test as requested
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

// Fetch Full Single Applicant Details for Verification Modal
router.get('/applicant/:email', async (req, res) => {
    try {
        const applicant = await Applicant.findOne({ email: req.params.email }).lean();
        if (!applicant) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, applicant });
    } catch (error) {
        console.error('Fetch Full Applicant Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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
                    { registeredAt: { $gte: startDate, $lt: endDate } },
                    { createdAt: { $gte: startDate, $lt: endDate } }
                ] 
            };
        } else if (year && year !== 'all') {
            const y = parseInt(year);
            const startDate = new Date(y, 0, 1);
            const endDate = new Date(y + 1, 0, 1);
            query = { 
                $or: [
                    { submittedAt: { $gte: startDate, $lt: endDate } },
                    { registeredAt: { $gte: startDate, $lt: endDate } },
                    { createdAt: { $gte: startDate, $lt: endDate } }
                ] 
            };
        }

        // Optimization: Exclude heavy fields from the main list to keep API fast.
        // When reports=true (ReportsTab), include psychometric fields so the Dossier tab works.
        const isReports = req.query.reports === 'true';

        // Base exclusions — always strip these heavy unused fields
        let selectStr = '-pendingExams -salaryBreakup -verificationChecks -tasks -offerLetterData -apptLetterData -answers -detailingScripts -issuedLetters -templateSettings -customAssetCategories -targetProductsList -designations -requiredDocs -miscLetters';

        if (!isReports) {
            // Non-reports views: also strip psychometric data and document/form data for speed
            selectStr += ' -mindsetReport -psychometricScores -documents -formData';
        }
        // When isReports=true: mindsetReport, psychometricScores, psychometricTestCompleted
        // are intentionally KEPT so the Psychometric Dossier tab can read them.

        const applicants = await Applicant.find(query)
            .select(selectStr)
            .sort({ submittedAt: -1, registeredAt: -1 })
            .lean(); // Fetch summary fields

        res.status(200).json({ success: true, applicants });
    } catch (error) {
        console.error("List Fetch Error:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET single applicant (Lazy loading heavy data on demand)
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

// DELETE single applicant (with cascading wipe of all test reports and document assets)
router.delete('/applicant/:email', async (req, res) => {
    try {
        const purgeResult = await purgeApplicantAndAllAssociatedRecords(req.params.email);
        if (!purgeResult.success || (!purgeResult.applicantFoundAndDeleted && purgeResult.deletedExamResultsCount === 0 && purgeResult.deletedAssetsCount === 0)) {
            return res.status(404).json({ error: 'Applicant or associated records not found' });
        }
        res.status(200).json({ success: true, message: `Applicant ${req.params.email} and all associated records (test scores, assets, files) purged successfully.`, details: purgeResult });
    } catch (error) {
        console.error("Delete Applicant Error:", error);
        res.status(500).json({ error: 'Failed to delete applicant' });
    }
});

// Public Endpoint to Serve Static Assets (Logos, Signatures, Stamps)
router.get('/api/public/asset/:assetId', async (req, res) => {
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
        console.log(`[DELETE-DOC] targetId: "${targetId}"`);
        const updatedDocs = (applicant.documents || []).filter(d => {
            const dId = String(d.assetId || d.filename || d.fileName || d.name || d._id || d.id || '').trim();
            const keep = dId !== targetId;
            if (!keep) console.log(`[DELETE-DOC] Found match! Deleting document with dId: "${dId}"`);
            return keep;
        });
        console.log(`[DELETE-DOC] Docs before: ${applicant.documents?.length || 0}, Docs after: ${updatedDocs.length}`);
        await Applicant.updateOne({ _id: applicant._id }, { $set: { documents: updatedDocs } });

        // Fix: get the relative path inside uploads/ directory
        const assetPath = String(assetId).replace(/^\/?api\/admin\/uploads\//, '').replace(/^\/?uploads\//, '').trim();
        const cleanFilename = assetPath.split('/').pop().trim();
        const filePath = path.join(__dirname, '..', 'uploads', ...assetPath.split('/'));
        
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

// --- DIVISION APIs ---
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

// Admin - DB Statistics
router.get('/db-stats', async (req, res) => {
    try {
        // Calculate database size by summing all tables in the public schema
        const [results] = await sequelize.query("SELECT sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint as size FROM pg_tables WHERE schemaname = 'public'");
        const totalUsed = parseInt(results[0].size || '0', 10);
        
        // Calculate size of uploaded files in /uploads directory
        let uploadsSize = 0;
        try {
            const uploadsDir = path.join(__dirname, '..', 'uploads');
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
                const st = fs.statfsSync(path.join(__dirname, '..'));
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

router.delete('/divisions/:id', async (req, res) => {
    try {
        await Division.findByIdAndUpdate(req.params.id, { active: false });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.delete('/hqs/:id', async (req, res) => {
    try {
        await HQ.findByIdAndUpdate(req.params.id, { active: false });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// --- AUTO REF NUMBER ---
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

// --- TEMPLATE MANAGEMENT ---
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
        else if (type === 'confirm_delayed') update.confirmDelayedLetterBody = body;
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
    } catch (err) {
        console.error('Save template error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

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
        console.log(`[DELETE-DOC] targetId: "${targetId}"`);
        const updatedDocs = (applicant.documents || []).filter(d => {
            const dId = String(d.assetId || d.filename || d.fileName || d.name || d._id || d.id || '').trim();
            const keep = dId !== targetId;
            if (!keep) console.log(`[DELETE-DOC] Found match! Deleting document with dId: "${dId}"`);
            return keep;
        });
        console.log(`[DELETE-DOC] Docs before: ${applicant.documents?.length || 0}, Docs after: ${updatedDocs.length}`);
        await Applicant.updateOne({ _id: applicant._id }, { $set: { documents: updatedDocs } });

        const cleanFilename = String(assetId).split('/').pop().trim();
        const filePath = path.join(__dirname, '..', 'uploads', cleanFilename);
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
            const uploadsDir = path.join(__dirname, '..', 'uploads');
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
                const st = fs.statfsSync(path.join(__dirname, '..'));
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
        else if (type === 'confirm_delayed') update.confirmDelayedLetterBody = body;
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
                case 'confirm_delayed': template = company.confirmDelayedLetterBody; break;
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
            'ADDRESS': [applicant.address || fd.address || '', fd.city || '', fd.state || '', fd.pin ? `PIN: ${fd.pin}` : ''].filter(Boolean).join(', ').toUpperCase(),
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
            'EMP_CODE': applicant.empCode || applicant.formData?.empCode || 'TBD',
            'OFFER_COUNTER': company.offerCounter || 1001,
            'APPT_COUNTER': company.apptCounter || 1001
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
    return (Number(sal.basic)||0) + (Number(sal.hra)||0) + (Number(sal.lta)||0) + (Number(sal.conveyance)||0) + (Number(sal.medical)||0) + (Number(sal.special)||0) + (Number(sal.edu)||0) + (Number(sal.fixed)||0) + (Number(sal.roundOff)||Number(sal.round_off)||0);
}

// --- UPDATE APPLICANT WORKFLOW DATA ---
router.post('/update-workflow-data', async (req, res) => {
    try {
        const { email, division, reportingTo, hq, empCode, refNo, salaryBreakup, verificationChecks, dob, actualJoiningDate, address, tasks, incrementData, fullName, phone, detailDesignation, detailHq, fatherName, gender, bloodGroup, maritalStatus,
                epfNumber, uanNumber, esiNumber, anniversaryDate, bankName, accNo, ifsc, salary } = req.body;
        const update = {};
        if (division !== undefined) update.division = division;
        if (reportingTo !== undefined) update.reportingTo = reportingTo;
        if (hq !== undefined) update.hq = hq;
        if (detailHq !== undefined) update.hq = detailHq;
        if (empCode !== undefined) update.empCode = empCode;
        if (refNo !== undefined) update.refNo = refNo;
        if (dob !== undefined) {
            update.dob = dob;
            update['formData.dob'] = dob;
        }
        if (actualJoiningDate !== undefined) update.actualJoiningDate = actualJoiningDate;
        if (address !== undefined) update.address = address;
        if (verificationChecks !== undefined) update.verificationChecks = verificationChecks;
        if (tasks !== undefined) update.tasks = tasks;
        if (incrementData !== undefined) update.incrementData = incrementData;
        if (salary !== undefined) update.salary = salary;

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

// --- SEND LETTER VIA EMAIL ---
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

// --- NEW: SAVE LETTER SNAPSHOT TO PORTAL ---
router.post('/save-letter-snapshot', async (req, res) => {
    try {
        const { email, letterType, letterData, pdfBase64, notifyByEmail } = req.body; // letterData can be HTML/Text or Base64
        const update = { canLogin: true }; // Automatically ensure access when a letter is pushed to hub
        if (letterType === 'confirm') update.status = 'Confirmed Employee';
        else if (letterType === 'confirm_delayed') update.status = 'Confirmation Extended';
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

        // Increment company counter
        let counterKey = "";
        if (letterType === 'offer') counterKey = 'offerCounter';
        else if (letterType === 'appt') counterKey = 'apptCounter';
        else if (letterType === 'revised_salary') counterKey = 'revisedSalaryCounter';
        else if (['emyfe', 'emyho', 'emyhr'].includes(letterType)) counterKey = 'empCodeCounter';
        else if (letterType && letterType.startsWith('misc_')) counterKey = 'miscCounter';

        if (counterKey) {
            await Company.findOneAndUpdate({}, {
                $inc: { [counterKey]: 1 }
            });
        }

        if (notifyByEmail) {
            const applicant = await Applicant.findOne({ email });
            const company = await Company.findOne() || { name: 'Emyris Biolifesciences' };
            const label = letterType.toUpperCase().replace('_', ' ');

            let attachments = [];
            if (pdfBase64) {
                attachments.push({
                    filename: `Emyris_Letter.pdf`,
                    content: pdfBase64,
                    contentType: 'application/pdf'
                });
            }

            await sendEmail({
                to: `${email}, hradmin@emyrishr.in`,
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
                `,
                attachments
            });
        }

        res.json({ success: true, message: `Letter saved to applicant hub${notifyByEmail ? ' and applicant notified' : ''}.` });
    } catch (e) { 
        console.error("Save snapshot error:", e);
        res.status(500).json({ error: 'Save failed' }); 
    }
});

// --- NEW: CLEAR LETTERS ---
router.post('/clear-applicant-letters', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });
        
        await Applicant.findOneAndUpdate({ email }, {
            $set: { issuedLetters: [] }
        });

        res.json({ success: true, message: 'All letters for this applicant have been wiped.' });
    } catch (e) {
        console.error("Clear letters error:", e);
        res.status(500).json({ error: 'Failed to clear letters' });
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

// --- NEW: LIFECYCLE CHECKS (Admins can poll this or call on load) ---
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

// Company Profile Fetching (With latest Assets)
router.get('/company-profile', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        let profile = await Company.findOne().lean();
        if (!profile) {
            // Creation will apply all schema defaults
            const newCompany = await Company.create({ name: "EMYRIS BIOLIFESCIENCES PVT LTD." });
            profile = newCompany.toObject();
        }

        // Legacy safety checks removed to allow explicit empty configurations

        // Hydrate with latest active assets from Asset DB (SKIP if light=true is passed for performance)
        if (req.query.light !== 'true') {
            const assetMap = {
                activeLogoId: 'logo',
                activePayslipLogoId: 'payslipLogo',
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
        }

        // Hydrate with latest active divisions and hqs
        const divisions = await Division.find({ active: true }).sort({ name: 1 }).lean();
        profile.divisions = divisions;
        const hqs = await HQ.find({ active: true }).sort({ name: 1 }).lean();
        profile.hqs = hqs;
        
        // Link XLA Designations globally across all portals
        const xlDsgs = await XlDesignation.findAll({ order: [['level', 'ASC']] });
        profile.designations = xlDsgs.map(d => ({ title: d.designationName, department: 'SALES' }));

        // Strip heavy HTML template bodies for the main profile endpoint to prevent 4MB payload
        delete profile.offerLetterBody;
        delete profile.apptLetterBody;
        delete profile.confirmLetterBody;
        delete profile.revisedSalaryBody;
        delete profile.incentiveCircularBody;

        res.status(200).json(profile);
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

// Applicant-facing unified company data (Hydrated with Divisions and HQs)

router.post('/company-profile', async (req, res) => {
    try {
        const updateData = req.body;
        // Don't allow overwriting _id or active
        delete updateData._id;
        
        let profile = await Company.findOne();
        if (!profile) {
            await Company.create({ name: "EMYRIS BIOLIFESCIENCES PVT LTD.", ...updateData });
        } else {
            await Company.updateOne({}, { ...updateData, $set: updateData });
            if (profile._id) {
                await Company.updateOne({ _id: profile._id }, { ...updateData, $set: updateData });
            }
        }
        res.json({ success: true, message: 'Profile updated' });
    } catch (e) {
        console.error('Company Profile Update Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

const DEFAULT_DETAILING_SCRIPTS = {
  'ALOMOS GOLD': {
    id: 'alomos-gold',
    name: 'ALOMOS GOLD',
    tagline: 'The Gold-Standard 5-in-1 Clinical Nutrition Formula',
    hook: "Good morning Doctor, I am Rahul Kumar, Regards from Emyris Biolifesciences Pvt. Ltd. Doctor, As you know...After major surgery, the biggest challenge is not just wound healing—it is rapid muscle loss, poor immunity, inflammation, and delayed recovery due to inadequate protein intake. Doctor, ALOMOS GOLD is specially designed as an advanced surgical recovery nutrition with high-quality whey protein isolate, probiotics, digestive enzymes, and curcumin to support faster recovery.",
    need: "Doctor, you will find Alomos Gold highly effective for: Post-Bariatric Surgery Patients (who require dense nutrition in small volumes), Critical Care & General Post-Surgical Recovery, Cancer Cachexia to prevent severe muscle wasting, and Sarcopenia & Geriatric Nutrition to improve strength.",
    pillars: [
      "Pure Whey Protein Isolate: It delivers an ultra-high protein density of 83.4g per 100g, yielding an exceptional 25g of pure protein per 30g serving to rapidly support post-surgical tissue repair and muscle recovery.",
      "Enhanced Bioavailability: We have infused a 1000mg DigeZyme Enzyme Blend (Amylase, Protease, Lactase, Lipase, & Cellulase) to ensure maximum absorption and easy digestion without bloating.",
      "Anti-Inflammatory Support: It contains 500mg Curcumin Extract to actively support post-surgical and anti-inflammatory recovery.",
      "Gut & Microbiome Health: It includes a potent 13.88 Billion CFU Probiotic Blend mixed with 12g of prebiotic fiber to maintain gut health, which is crucial for recovering patients often on heavy medications.",
      "Optimal BCAA Profile: It delivers 4,706mg of total BCAAs per serving to optimally trigger muscle protein synthesis."
    ],
    closing: "For your patients' safety and compliance, it is completely Sugar-Free and Gluten-Free. It is available in a highly palatable chocolate flavor in both 500g and 1kg packs. Considering its comprehensive 5-in-1 nutritional profile, I request you to please prescribe Alomos Gold for your next post-surgical or recovering patients. Doctor, can I get at least 5 prescriptions of Alomos Gold today?",
    fullText: "Good morning Doctor, I am Rahul Kumar, Regards from Emyris Biolifesciences Pvt. Ltd. Doctor, As you know...After major surgery, the biggest challenge is not just wound healing-it is rapid muscle loss, poor immunity, inflammation, and delayed recovery due to inadequate protein intake. Doctor, ALOMOS GOLD is specially designed as an advanced surgical recovery nutrition with high-quality whey protein isolate, probiotics, digestive enzymes, and curcumin to support faster recovery. Doctor, you will find Alomos Gold highly effective for Post-Bariatric Surgery Patients, Critical Care & General Post-Surgical Recovery, Cancer Cachexia, and Sarcopenia & Geriatric Nutrition. Doctor, what makes Alomos Gold the gold standard in protein quality is its unique 5-in-1 benefits formula: Pure Whey Protein Isolate delivers an ultra-high protein density of 83.4g per 100g, yielding an exceptional 25g of pure protein per 30g serving to rapidly support post-surgical tissue repair and muscle recovery. Enhanced Bioavailability: We have infused a 1000mg DigeZyme Enzyme Blend to ensure maximum absorption and easy digestion without bloating. Anti-Inflammatory Support: It contains 500mg Curcumin Extract to actively support post-surgical and anti-inflammatory recovery. Gut & Microbiome Health: It includes a potent 13.88 Billion CFU Probiotic Blend mixed with 12g of prebiotic fiber to maintain gut health. Optimal BCAA Profile: It delivers 4,706mg of total BCAAs per serving to optimally trigger muscle protein synthesis. For your patients' safety and compliance, it is completely Sugar-Free and Gluten-Free. It is available in a highly palatable chocolate flavor in both 500g and 1kg packs. Considering its comprehensive 5-in-1 nutritional profile, I request you to please prescribe Alomos Gold for your next post-surgical or recovering patients. Doctor, can I get at least 5 prescriptions of Alomos Gold today?",
    keywords: [
      { word: "Whey Protein Isolate", category: "Core Protein" },
      { word: "25g", category: "Dosage Strength" },
      { word: "83.4g", category: "Protein Density" },
      { word: "BCAAs", category: "Muscle Synthesis" },
      { word: "4,706mg", category: "BCAA Strength" },
      { word: "DigeZyme", category: "Enzyme Matrix" },
      { word: "1000mg", category: "Enzyme Strength" },
      { word: "Probiotics", category: "Gut Health" },
      { word: "13.88 Billion CFU", category: "Probiotic Strength" },
      { word: "Prebiotic fiber", category: "Microbiome" },
      { word: "12g", category: "Prebiotic Strength" },
      { word: "Curcumin Extract", category: "Anti-Inflammatory" },
      { word: "500mg", category: "Curcumin Strength" },
      { word: "Sugar-Free", category: "Safety Profile" },
      { word: "Gluten-Free", category: "Safety Profile" },
      { word: "Chocolate flavor", category: "Palatability" },
      { word: "5 prescriptions", category: "Closing Target" }
    ]
  },
  'GLOWVIT-60K': {
    id: 'glowvit-60k',
    name: 'GLOWVIT-60K',
    tagline: 'Advanced Vitamin D3 Nano Formula Oral Shot',
    hook: "Good Morning Doctor! I am pleased to present GLOWVIT-60K, our advanced ready-to-use Vitamin D3 Nano Oral Solution delivering 60,000 IU for rapid bone mineralization and systemic clinical support.",
    need: "Doctor, standard D3 tablets often suffer from poor intestinal absorption and delayed onset in severe osteopenia, osteoporosis, and elderly patients.",
    pillars: [
      "Advanced Nano-Emulsion Technology: Ensures 95%+ bioavailability and 3x faster absorption directly into circulation compared to conventional oil granules or tablets.",
      "Ready-to-Use 5ml Oral Shot: Zero mixing needed, ensuring 100% patient compliance especially in elderly and post-menopausal women.",
      "Pleasant Palatability: Delivers robust support for bone density, muscular strength, and insulin sensitivity without any metallic aftertaste."
    ],
    closing: "Please prescribe GLOWVIT-60K 5ml oral shot once weekly for 6 to 8 weeks for rapid deficiency correction, and once monthly for maintenance.",
    fullText: "Good Morning Doctor! I am pleased to present GLOWVIT-60K, our advanced ready-to-use Vitamin D3 Nano Oral Solution delivering 60,000 IU for rapid bone mineralization and systemic clinical support. Doctor, standard D3 tablets often suffer from poor intestinal absorption and delayed onset in severe osteopenia, osteoporosis, and elderly patients. First, GLOWVIT-60K utilizes Advanced Nano-Emulsion Technology, ensuring 95% bioavailability and 3 times faster absorption directly into circulation compared to conventional oil granules. Second, it is presented in a ready-to-use 5 millilitre oral shot requiring zero mixing, guaranteeing 100% patient compliance. Third, beyond calcium absorption, it significantly supports skeletal muscle strength and insulin sensitivity. Please prescribe GLOWVIT-60K 5 millilitre oral shot once weekly for 6 to 8 weeks for rapid deficiency correction.",
    keywords: [
      { word: "60,000 IU", category: "Potency" },
      { word: "Nano", category: "Technology" },
      { word: "Bioavailability", category: "Absorption" },
      { word: "Ready-to-Use", category: "Convenience" },
      { word: "5ml", category: "Volume" },
      { word: "Weekly", category: "Regimen" }
    ]
  },
  'Emystein': {
    id: 'emystein',
    name: 'Emystein 3miu',
    tagline: 'Broad-Spectrum Colistimethate Sodium for ICU Infection',
    hook: "Good Morning Doctor! I am introducing Emystein 3 MIU, our critical-care Colistimethate Sodium injection engineered for life-saving efficacy against multi-drug resistant Gram-negative pathogens.",
    need: "Doctor, in Intensive Care Units, Pseudomonas aeruginosa and Acinetobacter infections demand immediate, bactericidal action where conventional beta-lactams fail.",
    pillars: [
      "Targeted Bactericidal Action: Rapidly disrupts bacterial cell membranes of multi-drug resistant Gram-negative organisms.",
      "Optimized 3 MIU Strength: Provides exact clinical titration for IV and aerosolized administration in ventilator-associated pneumonia.",
      "High Purity & Safety Profile: Manufactured under strict lyophilization standards to minimize nephrotoxicity risks when dosed per renal guidelines."
    ],
    closing: "Please consider Emystein 3 MIU as your trusted first-line defense in critical ICU multi-drug resistant infections.",
    fullText: "Good Morning Doctor! I am introducing Emystein 3 MIU, our critical-care Colistimethate Sodium injection engineered for life-saving efficacy against multi-drug resistant Gram-negative pathogens. Doctor, in Intensive Care Units, Pseudomonas aeruginosa and Acinetobacter infections demand immediate, bactericidal action where conventional beta-lactams fail. First, Emystein delivers targeted bactericidal action that rapidly disrupts bacterial cell membranes of resistant Gram-negative organisms. Second, its optimized 3 Million International Units strength allows exact clinical titration for IV and aerosolized administration. Third, it is manufactured under strict lyophilization standards to ensure high purity and consistent ICU performance. Please prescribe Emystein 3 MIU as your trusted defense in critical ICU infections.",
    keywords: [
      { word: "Colistimethate", category: "Molecule" },
      { word: "3 MIU", category: "Strength" },
      { word: "Gram-negative", category: "Spectrum" },
      { word: "ICU", category: "Indication" },
      { word: "Pseudomonas", category: "Pathogen" }
    ]
  }
};

router.post('/save-detailing-scripts', async (req, res) => {
    try {
        const { detailingScripts } = req.body;
        if (!detailingScripts || typeof detailingScripts !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid detailingScripts data' });
        }
        let profile = await Company.findOne();
        if (!profile) {
            await Company.create({ name: "EMYRIS BIOLIFESCIENCES PVT LTD.", detailingScripts });
        } else {
            if (profile._id) {
                await Company.updateOne({ _id: profile._id }, { $set: { detailingScripts } });
            } else {
                await Company.updateOne({}, { $set: { detailingScripts } });
            }
        }
        res.json({ success: true, message: 'Detailing scripts saved successfully' });
    } catch (e) {
        console.error('Save Detailing Scripts Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/api/company-data', async (req, res) => {
    try {
        const company = await Company.findOne().lean();
        if (!company) return res.status(404).json({ error: 'Not found' });
        
        // Link XLA Designations globally
        const xlDsgs = await XlDesignation.findAll({ order: [['level', 'ASC']] });
        company.designations = xlDsgs.map(d => ({ title: d.designationName, department: 'SALES' }));

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
            detailingScripts: (company.detailingScripts && Object.keys(company.detailingScripts).length > 0) ? company.detailingScripts : DEFAULT_DETAILING_SCRIPTS,
            logo: "",
            payslipLogo: ""
        };

        // Hydrate assets
        if (company.activeLogoId) {
            const asset = await Asset.findById(company.activeLogoId).lean();
            if (asset) data.logo = asset.data;
        }
        if (company.activePayslipLogoId) {
            const asset = await Asset.findById(company.activePayslipLogoId).lean();
            if (asset) data.payslipLogo = asset.data;
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
                case 'confirm_delayed': template = company.confirmDelayedLetterBody; break;
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
        const annualCTC = parseFloat(applicant.salary) || (monthlyTotal * 12);

        const map = {
            'FULL_NAME': applicant.fullName.toUpperCase(),
            'FIRST_NAME': applicant.fullName.split(' ')[0],
            'TITLE': ((fd.gender||'').toLowerCase() === 'female' ? 'Ms.' : 'Mr.'),
            'TITLE_SHORT': ((fd.gender||'').toLowerCase() === 'female' ? 'Ms.' : 'Mr.'),
            'PHONE': applicant.phone,
            'ADDRESS': [applicant.address || fd.address || '', fd.city || '', fd.state || '', fd.pin ? `PIN: ${fd.pin}` : ''].filter(Boolean).join(', ').toUpperCase(),
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
            'EMP_CODE': applicant.empCode || applicant.formData?.empCode || 'TBD',
            'OFFER_COUNTER': company.offerCounter || 1001,
            'APPT_COUNTER': company.apptCounter || 1001
        };

        const resolved = resolveTemplate(template, map);
        res.json({ success: true, resolved });
    } catch (e) {
        res.status(500).json({ error: 'Render failed' });
    }
});

router.post('/update-workflow-data', async (req, res) => {
    try {
        const { email, division, reportingTo, hq, empCode, refNo, salaryBreakup, salary, verificationChecks, dob, actualJoiningDate, address, tasks, incrementData, fullName, phone, detailDesignation, detailHq, fatherName, gender, bloodGroup, maritalStatus,
                epfNumber, uanNumber, esiNumber, anniversaryDate, bankName, accNo, ifsc } = req.body;
        const update = {};
        if (division !== undefined) update.division = division;
        if (reportingTo !== undefined) update.reportingTo = reportingTo;
        if (hq !== undefined) update.hq = hq;
        if (detailHq !== undefined) update.hq = detailHq;
        if (empCode !== undefined) update.empCode = empCode;
        if (refNo !== undefined) update.refNo = refNo;
        if (dob !== undefined) {
            update.dob = dob;
            update['formData.dob'] = dob;
        }
        if (actualJoiningDate !== undefined) update.actualJoiningDate = actualJoiningDate;
        if (address !== undefined) update.address = address;
        if (verificationChecks !== undefined) update.verificationChecks = verificationChecks;
        if (tasks !== undefined) update.tasks = tasks;
        if (incrementData !== undefined) update.incrementData = incrementData;
        if (salaryBreakup !== undefined) update.salaryBreakup = salaryBreakup;
        if (salary !== undefined) update.salary = salary;

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
        const uploadsDir = path.join(__dirname, '..', 'uploads');
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
        const backupPath = path.join(__dirname, '..', 'mongodb_backup_full.json');
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

        // 2. Asset restore from MongoDB removed as per user request

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

        let finalData = data;
        
        // Convert heavy image uploads to WebP to save database space
        if (typeof data === 'string' && data.startsWith('data:image/') && !data.startsWith('data:image/webp')) {
            try {
                const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
                    finalData = 'data:image/webp;base64,' + webpBuffer.toString('base64');
                }
            } catch (err) {
                console.error("Failed to convert image to webp:", err);
            }
        }

        const asset = await Asset.create({ category, name, data: finalData });

        if (setActive) {
            const company = await Company.findOne();
            if (company) {
                const map = {
                    'logo': 'activeLogoId',
                    'payslipLogo': 'activePayslipLogoId',
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
            const keys = ['activeLogoId', 'activePayslipLogoId', 'activeStampId', 'activeSignatureId', 'activeLetterheadId'];
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
            'payslipLogo': 'activePayslipLogoId',
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
        if (!email) return res.status(400).json({ error: 'Email required' });
        const purgeResult = await purgeApplicantAndAllAssociatedRecords(email);
        if (!purgeResult.success || !purgeResult.applicantFoundAndDeleted) {
            return res.status(404).json({ error: 'Applicant not found' });
        }
        res.json({ success: true, message: `Applicant ${email} and all linked assets, test results, and files deleted cleanly.`, details: purgeResult });
    } catch (e) {
        console.error('Delete error:', e);
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/system/vacuum', async (req, res) => {
    try {
        const company = await Company.findOne();
        const applicants = await Applicant.find();

        // 0. Clean broken base64 and duplicate documents from Applicants
        for (let app of applicants) {
            if (app.documents && Array.isArray(app.documents)) {
                const originalLength = app.documents.length;
                
                // Clean Base64 strings and oversize assetIds
                let cleanDocs = app.documents.filter(doc => {
                    const assetId = String(doc.assetId || '');
                    if (assetId.startsWith('data:image')) return false;
                    if (assetId.length > 500) return false;
                    return true;
                });
                
                // Deduplicate by assetId to prevent "board certificate.jpg" duplicates
                const uniqueDocs = [];
                const seenAssets = new Set();
                for (let doc of cleanDocs) {
                    const assetId = String(doc.assetId || doc.filename || doc.name || '').trim();
                    if (assetId && !seenAssets.has(assetId)) {
                        seenAssets.add(assetId);
                        uniqueDocs.push(doc);
                    }
                }
                
                if (uniqueDocs.length !== originalLength) {
                    await Applicant.updateOne({ _id: app._id }, { $set: { documents: uniqueDocs } });
                    app.documents = uniqueDocs; // update memory ref for step 1
                }
            }
        }

        // 1. Collect all "In-Use" Asset IDs (clean filenames)
        const inUseIds = new Set();
        
        // From Company Branding
        if (company) {
            ['activeLogoId', 'activePayslipLogoId', 'activeStampId', 'activeSignatureId', 'activeLetterheadId'].forEach(key => {
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
        const uploadsDir = path.join(__dirname, '..', 'uploads');
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
        
        const latestExam = await ExamResult.findOne({ email: req.params.email }).sort({ submittedAt: -1 });
        if (latestExam) {
            applicant.rapidTestTotal = latestExam.totalQuestions || 20;
            if (applicant.rapidTestScore !== latestExam.autoScore) {
                applicant.rapidTestScore = latestExam.autoScore;
                await Applicant.updateOne({ email: req.params.email }, { $set: { rapidTestScore: latestExam.autoScore } });
            }
        }
        
        res.json({ success: true, applicant });
    } catch (e) { res.status(500).json({ success: false }); }
});

router.get('/pending-exams', async (req, res) => {
    try {
        let exams = await ExamResult.find().sort({ submittedAt: -1 });
        const questions = await Question.find();
        
        // Ensure answers JSON strings from TEXT columns are properly parsed
        exams = (exams || []).map(ex => {
            if (ex && typeof ex.answers === 'string') {
                try { ex.answers = JSON.parse(ex.answers); } catch(err) {}
            }
            // Auto-fix concatenated total scores on the fly
            if (ex) {
                const a = isNaN(parseInt(ex.autoScore, 10)) ? 0 : parseInt(ex.autoScore, 10);
                const m = isNaN(parseInt(ex.manualScore, 10)) ? 0 : parseInt(ex.manualScore, 10);
                
                const updateDoc = {};
                let needsUpdate = false;
                
                if (ex.totalScore !== (a + m)) {
                   ex.totalScore = a + m;
                   updateDoc.totalScore = a + m;
                   updateDoc.autoScore = a;
                   updateDoc.manualScore = m;
                   needsUpdate = true;
                }
                
                // Dynamically calculate missing mcqTotal / descTotal
                if (ex.testedProduct && !ex.mcqTotal && !ex.descTotal) {
                    let mcqCount = 0;
                    let descCount = 0;
                    const examQs = questions.filter(q => q.targetProduct === ex.testedProduct);
                    examQs.forEach(q => {
                        if (q.questionType === 'mcq') mcqCount++;
                        else descCount++;
                    });
                    
                    if (mcqCount === 0 && descCount === 0 && ex.totalQuestions > 0) {
                        mcqCount = ex.totalQuestions; // fallback assumption
                    }
                    
                    ex.mcqTotal = mcqCount;
                    ex.descTotal = descCount;
                    updateDoc.mcqTotal = mcqCount;
                    updateDoc.descTotal = descCount;
                    needsUpdate = true;
                }

                if (needsUpdate && typeof ex.updateOne === 'function') {
                    // Save corrected score back to DB asynchronously
                    ExamResult.updateOne({ _id: ex._id }, { $set: updateDoc }).exec().catch(()=>{});
                } else if (needsUpdate && ex._id) {
                    ExamResult.updateOne({ _id: ex._id }, { $set: updateDoc }).exec().catch(()=>{});
                }
            }
            return ex;
        });
        
        res.json({ success: true, exams, questions });
    } catch (e) {
        console.error('Fetch Pending Exams Error:', e);
        res.status(500).json({ error: 'Failed to fetch pending exams' });
    }
});

router.post('/grade-exam', async (req, res) => {
    try {
        const examId = req.body.examId || req.body.id;
        const manualScore = req.body.manualScore;
        if (!examId) return res.status(400).json({ error: 'Exam ID required' });
        
        const exam = await ExamResult.findOne({ _id: examId });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        
        const parsedManualScore = isNaN(parseInt(manualScore, 10)) ? 0 : parseInt(manualScore, 10);
        const parsedAutoScore = isNaN(parseInt(exam.autoScore, 10)) ? 0 : parseInt(exam.autoScore, 10);
        const total = parsedAutoScore + parsedManualScore;
        
        await ExamResult.updateOne({ _id: examId }, {
            $set: {
                manualScore: parsedManualScore,
                totalScore: total,
                status: 'graded'
            }
        });
        
        const company = await Company.findOne() || { name: 'Emyris Biolifesciences' };
        
        try {
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
        } catch (emailErr) {
            console.error('Failed to send grading notification email:', emailErr.message);
        }
        
        res.json({ success: true, totalScore: total });
    } catch (e) {
        console.error('Grade Exam Error:', e);
        res.status(500).json({ error: 'Failed to grade exam' });
    }
});

// --- ATTENDANCE & PAYRUN ROUTES ---
router.post('/upload-attendance', uploadAttendance.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        res.json({ success: true, message: 'Attendance report uploaded successfully' });
    } catch (e) {
        console.error('Upload error:', e);
        res.status(500).json({ error: 'Failed to upload' });
    }
});

router.get('/debug-loans', async (req, res) => {
    try {
        const { email, month = 'July', year = '2026' } = req.query;
        let loans;
        let applicantTrace = null;
        if (email) {
            const applicant = await Applicant.findOne({ email });
            applicantTrace = applicant ? applicant.email : null;
            loans = await AssignedLoan.find({ employeeEmail: applicantTrace || email, status: 'Ongoing', deductionType: 'Monthly' });
        } else {
            loans = await AssignedLoan.find({ status: 'Ongoing', deductionType: 'Monthly' });
        }
        
        // Date parsing identical to payrun-preview
        const parseDMY = (dateString) => {
            if (!dateString) return null;
            const parts = dateString.split(/[-/]/);
            if (parts.length !== 3) {
                const d = new Date(dateString);
                return isNaN(d.getTime()) ? null : d;
            }
            if (parts[0].length === 4) {
                const d = new Date(dateString);
                return isNaN(d.getTime()) ? null : d;
            }
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // YYYY-MM-DD
        };
        const payrunStart = new Date(parseInt(year), new Date(`${month} 1, ${year}`).getMonth(), 1);
        
        const debugInfo = loans.map(loan => {
            const dedDate = parseDMY(loan.deductionDate);
            const compDate = dedDate ? new Date(dedDate.getFullYear(), dedDate.getMonth(), 1) : null;
            const willDeduct = dedDate && payrunStart >= compDate;
            return {
                id: loan._id,
                email: loan.employeeEmail,
                deductionDateOriginal: loan.deductionDate,
                dedDateParsed: dedDate,
                payrunStart,
                compDate,
                willDeduct,
                balance: loan.balanceAmount,
                installment: loan.installmentAmount
            };
        });

        res.json({ success: true, count: loans.length, payrunStart, debugInfo, loans });
    } catch (e) {
        res.status(500).json({ error: e.toString(), stack: e.stack });
    }
});

router.get('/payrun-preview', async (req, res) => {
    try {
        const { month, year, forceCsv } = req.query;

        // Check if payslips already exist in DB
        // If forceCsv is true, we skip this to force recalculation from the uploaded file
        if (forceCsv !== 'true') {
            const savedPayslips = await Payslip.find({ month, year });
            if (savedPayslips && savedPayslips.length > 0) {
                const previews = savedPayslips.map(ps => {
                if (ps.calculatedSalaryBreakup && ps.calculatedSalaryBreakup.empName) {
                    return ps.calculatedSalaryBreakup;
                } else {
                    return {
                        empName: ps.empName,
                        email: ps.email,
                        totalMonthDays: ps.totalDays,
                        payableDays: ps.payableDays,
                        finalSalary: ps.grossSalary,
                        calcBreakup: ps.calculatedSalaryBreakup || {},
                        sendEmail: true
                    };
                }
            });
            
            const company = await Company.findOne() || {};
            const mailConfig = {
                emailMessage: company.templateSettings?.payrunEmailMessage || 'Please find attached your salary slip for this month.',
                preparedBy: company.templateSettings?.payrunPreparedBy || 'Medorn HRMS Software',
                sanctionedBy: company.templateSettings?.payrunSanctionedBy || 'Rishita Dash',
                logoId: company.activePayslipLogoId || company.activeLogoId || null,
                signatureId: company.activeSignatureId || null
            };
            return res.json({ success: true, previews, mailConfig, loadedFromDb: true });
        }
        }

        const filePath = path.join(__dirname, '../Attendance/LATEST_ATTENDANCE.xlsx');
        if (!fs.existsSync(filePath)) {
            const fallbackPath = path.join(__dirname, '../Attendance/JULY ATTENDANCE REPORT.xlsx');
            if (fs.existsSync(fallbackPath)) {
                fs.copyFileSync(fallbackPath, filePath);
            } else {
                return res.json({ success: true, previews: [], message: 'No attendance report found. Please upload one.' });
            }
        }
        
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        const previews = [];
        const allApplicants = await Applicant.find({});
        
        const payrunStart = new Date(parseInt(year), new Date(`${month} 1, ${year}`).getMonth(), 1);
        const payrunEnd = new Date(parseInt(year), new Date(`${month} 1, ${year}`).getMonth() + 1, 0);

        const parseDMY = (dateString) => {
            if (!dateString) return null;
            const parts = dateString.split(/[-/]/);
            if (parts.length !== 3) {
                const d = new Date(dateString);
                return isNaN(d.getTime()) ? null : d;
            }
            if (parts[0].length === 4) {
                const d = new Date(dateString);
                return isNaN(d.getTime()) ? null : d;
            }
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        };
        
        for (const applicant of allApplicants) {
            let adoj = applicant.actualJoiningDate ? parseDMY(applicant.actualJoiningDate) : null;
            
            // If the employee joined AFTER the payrun month ended, completely exclude them
            if (adoj && !isNaN(adoj.getTime()) && adoj > payrunEnd) {
                continue;
            }

            const sb = applicant.salaryBreakup || {};

            const row = data.find(r => {
                let rowEmpCode = '';
                let rowEmpName = '';
                for (const key of Object.keys(r)) {
                    const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (k === 'employeecode' || k === 'empcode' || k === 'code') rowEmpCode = (r[key] || '').toString().trim().toLowerCase();
                    if (k === 'employeename' || k === 'empname' || k === 'name' || k === 'employee') rowEmpName = (r[key] || '').toString().trim().toLowerCase();
                }
                
                const appEmpCode = (applicant.empCode || '').toString().toLowerCase().replace(/\s+/g, '');
                const appFullName = (applicant.fullName || '').toString().trim().toLowerCase();
                rowEmpCode = rowEmpCode.replace(/\s+/g, '');
                
                // Match by either exact Employee Code, partial Employee Code, exact Full Name, or partial Full Name
                return (rowEmpCode && appEmpCode && (rowEmpCode === appEmpCode || rowEmpCode.includes(appEmpCode) || appEmpCode.includes(rowEmpCode))) || 
                       (rowEmpName && appFullName && (rowEmpName === appFullName || rowEmpName.includes(appFullName) || appFullName.includes(rowEmpName)));
            });
            
            if (row) {
                let present = 0, holiday = 0, leave = 0, absent = 0, totalMonthDays = 0;
                const dateRegex = /^\d{2} [A-Za-z]{3}/; 
                
                for (const key of Object.keys(row)) {
                    if (dateRegex.test(key)) {
                        totalMonthDays++;
                        const val = (row[key] || '').toString().trim().toUpperCase();
                        if (val === 'P') present++;
                        else if (val === 'H') holiday++;
                        else if (val === 'L') leave++;
                        else if (val === 'A') absent++;
                    }
                }
                
                if (totalMonthDays === 0) totalMonthDays = 31;

                let payableDays = totalMonthDays - absent;
                if (payableDays < 0) payableDays = 0;
                
                // If they joined in the middle of this payrun month, cap their max payable days
                let maxPayableDays = totalMonthDays;
                if (adoj && !isNaN(adoj.getTime()) && adoj >= payrunStart && adoj <= payrunEnd) {
                    maxPayableDays = payrunEnd.getDate() - adoj.getDate() + 1;
                }
                
                if (payableDays > maxPayableDays) payableDays = maxPayableDays;
                if (payableDays > totalMonthDays) payableDays = totalMonthDays;
                
                const basic = parseFloat(sb.v_salBasic || sb.basic || 0);
                const hra = parseFloat(sb.v_salHra || sb.hra || 0);
                const conv = parseFloat(sb.v_salConv || sb.conveyance || 0);
                const med = parseFloat(sb.v_salMed || sb.medical || 0);
                const lta = parseFloat(sb.v_salLta || sb.lta || 0);
                const edu = parseFloat(sb.v_salEdu || sb.edu || 0);
                const special = parseFloat(sb.v_salSpecial || sb.special || 0);
                
                const originalGross = basic + hra + conv + med + lta + edu + special;
                const factor = payableDays / totalMonthDays;
                
                let ptDed = 0;
                let pfDed = 0;
                if (sb.applyPt !== false) {
                    if (originalGross > 20000) ptDed = 200;
                    else if (originalGross > 15000) ptDed = 150;
                }
                if (sb.applyPf !== false) {
                    if (originalGross >= 15000) pfDed = 1800;
                    else pfDed = 1200;
                }

                const calcBreakup = {
                    basic: Math.round(basic * factor),
                    hra: Math.round(hra * factor),
                    conveyance: Math.round(conv), 
                    medical: Math.round(med), 
                    lta: Math.round(lta * factor),
                    edu: Math.round(edu), 
                    special: Math.round(special * factor)
                };
                
                const baseNetSalary = Object.values(calcBreakup).reduce((a, b) => a + parseFloat(b), 0);
                const dailyRate = originalGross / totalMonthDays;
                
                // --- Loan & Advance Deduction Logic ---
                let loanDed = 0;
                let advDed = 0;
                let loanDetails = [];
                let advDetails = [];

                try {
                    // 1. Fetch Active Loans for Monthly Deduction (Memory-based case-insensitive match to avoid DB adapter issues)
                    const allOngoingLoans = await AssignedLoan.find({ status: 'Ongoing', deductionType: 'Monthly' });
                    const activeLoans = allOngoingLoans.filter(l => l.employeeEmail && applicant.email && l.employeeEmail.trim().toLowerCase() === applicant.email.trim().toLowerCase());

                    for (const loan of activeLoans) {
                        const dedDate = parseDMY(loan.deductionDate);
                        if (dedDate && payrunStart >= new Date(dedDate.getFullYear(), dedDate.getMonth(), 1)) {
                            let availableDed = loan.installmentAmount;
                            if (loan.balanceAmount < availableDed) availableDed = loan.balanceAmount;
                            if (availableDed > 0) {
                                loanDed += availableDed;
                                loanDetails.push({
                                    _id: loan._id,
                                    name: loan.nameOnPayslip || 'Loan',
                                    amount: Math.round(availableDed)
                                });
                            }
                        }
                    }

                    // 2. Fetch Active Advances for Monthly Deduction (Memory-based case-insensitive match)
                    const allOngoingAdvances = await AssignedAdvance.find({ status: 'Ongoing', deductionType: 'Monthly' });
                    const activeAdvances = allOngoingAdvances.filter(a => a.employeeEmail && applicant.email && a.employeeEmail.trim().toLowerCase() === applicant.email.trim().toLowerCase());

                    for (const adv of activeAdvances) {
                        let dStart = null;
                        if (adv.deductionMonth) {
                            const parts = adv.deductionMonth.split('-');
                            if (parts.length >= 2) {
                                dStart = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                            } else {
                                dStart = parseDMY(adv.deductionMonth);
                            }
                        } else if (adv.sanctionDate) {
                            dStart = parseDMY(adv.sanctionDate);
                        }
                        
                        if (dStart && payrunStart >= new Date(dStart.getFullYear(), dStart.getMonth(), 1)) {
                            let availableDed = adv.installmentAmount;
                            if (adv.balanceAmount < availableDed) availableDed = adv.balanceAmount;
                            if (availableDed > 0) {
                                advDed += availableDed;
                                advDetails.push({
                                    _id: adv._id,
                                    name: adv.nameOnPayslip || 'Salary Advance',
                                    amount: Math.round(availableDed)
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error calculating loan/adv deductions:", err);
                }
                
                previews.push({
                    empName: applicant.fullName,
                    empCode: applicant.empCode,
                    email: applicant.email,
                    designation: applicant.designation || 'NA',
                    department: applicant.department || 'NA',
                    division: applicant.division || 'NA',
                    uanNumber: applicant.uanNumber || 'NA',
                    epfNumber: applicant.epfNumber || 'NA',
                    esiNumber: applicant.esiNumber || 'NA',
                    fatherName: applicant.formData?.fatherName || 'NA',
                    panNumber: applicant.formData?.panNumber || 'NA',
                    bankName: applicant.formData?.bankName || 'NA',
                    accNo: applicant.formData?.accNo || 'NA',
                    ifsc: applicant.formData?.ifsc || 'NA',
                    present, absent, leave, holiday,
                    payableDays, totalMonthDays, 
                    originalGross: Math.round(originalGross),
                    baseNetSalary: Math.round(baseNetSalary),
                    dailyRate: Math.round(dailyRate),
                    ptDed: Math.round(ptDed),
                    pfDed: Math.round(pfDed),
                    loanDed: Math.round(loanDed),
                    advDed: Math.round(advDed),
                    loanDetails,
                    advDetails,
                    penaltyDays: 0,
                    salDed: 0,
                    expense: 0,
                    finalSalary: Math.round(baseNetSalary - ptDed - pfDed - loanDed - advDed),
                    sendEmail: true,
                    calcBreakup
                });
            }
        }

        const company = await Company.findOne() || {};
        const mailConfig = {
            emailMessage: company.templateSettings?.payrunEmailMessage || 'Please find attached your salary slip for this month.',
            preparedBy: company.templateSettings?.payrunPreparedBy || 'Medorn HRMS Software',
            sanctionedBy: company.templateSettings?.payrunSanctionedBy || 'Rishita Dash',
            logoId: company.activePayslipLogoId || company.activeLogoId || null,
            signatureId: company.activeSignatureId || null
        };

        res.json({ success: true, previews, mailConfig });
    } catch (e) {
        console.error('Payrun preview error:', e);
        res.status(500).json({ error: 'Failed to generate payrun preview' });
    }
});

router.post('/save-payrun-config', async (req, res) => {
    try {
        const { emailMessage, preparedBy, sanctionedBy } = req.body;
        const company = await Company.findOne();
        if (!company) return res.status(404).json({ error: 'Company not found' });
        
        const currentSettings = company.templateSettings || {};
        const updatedSettings = {
            ...currentSettings,
            payrunEmailMessage: emailMessage,
            payrunPreparedBy: preparedBy,
            payrunSanctionedBy: sanctionedBy
        };
        
        await Company.updateOne({ _id: company._id }, { $set: { templateSettings: updatedSettings } });
        res.json({ success: true, message: 'Payrun configuration saved successfully' });
    } catch (e) {
        console.error('Error saving payrun config:', e);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

router.post('/generate-payslips', async (req, res) => {
    try {
        const { previews } = req.body;
        if (!previews || !previews.length) return res.status(400).json({ error: 'No previews to process.' });
        
        for (const p of previews) {
            await Payslip.create({
                email: p.email,
                empName: p.empName,
                month: new Date().toLocaleString('default', { month: 'long' }),
                year: new Date().getFullYear().toString(),
                payableDays: p.payableDays,
                totalDays: p.totalMonthDays,
                grossSalary: parseFloat(p.finalSalary), // Final salary calculated from frontend
                calculatedSalaryBreakup: p.calcBreakup,
                ptDed: p.ptDed,
                pfDed: p.pfDed,
                salDed: p.salDed
            });
        }
        res.json({ success: true, count: previews.length });
    } catch (e) {
        console.error('Generate payslip error:', e);
        res.status(500).json({ error: 'Failed to generate payslips' });
    }
});

// ===== PAYRUN FINALIZATION AND REPORTING ENGINE =====

router.post('/finalize-payrun', async (req, res) => {
    try {
        const { month, year, previews } = req.body;
        if (!month || !year || !previews || !previews.length) return res.status(400).json({ error: 'Missing data payload' });

        // Safely overwrite: delete any previously finalized runs for this month/year combination
        await Payslip.destroy({ where: { month, year } });

        const toInsert = previews.map((p) => ({
            email: p.email || 'no-email@example.com',
            empName: p.empName || 'Unknown Employee',
            month,
            year,
            payableDays: p.payableDays,
            totalDays: p.totalMonthDays,
            grossSalary: parseFloat(p.finalSalary) || 0,
            calculatedSalaryBreakup: p
        }));

        await Payslip.create(toInsert);

        const filePath = path.join(__dirname, '../Attendance/LATEST_ATTENDANCE.xlsx');
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch(e) {
                console.error("Failed to delete LATEST_ATTENDANCE.xlsx:", e);
            }
        }

        // --- Apply Loan and Advance Deductions ---
        for (const p of previews) {
            if (p.loanDetails && Array.isArray(p.loanDetails)) {
                for (const ld of p.loanDetails) {
                    if (ld._id && ld.amount) {
                        try {
                            const loan = await AssignedLoan.findById(ld._id);
                            if (loan) {
                                loan.amountPaid = (loan.amountPaid || 0) + ld.amount;
                                loan.balanceAmount = (loan.balanceAmount || 0) - ld.amount;
                                if (loan.balanceAmount <= 0) {
                                    loan.balanceAmount = 0;
                                    loan.status = 'Paid';
                                }
                                await loan.save();
                            }
                        } catch (err) {
                            console.error(`Error updating loan ${ld._id} during payrun finalize:`, err);
                        }
                    }
                }
            }

            if (p.advDetails && Array.isArray(p.advDetails)) {
                for (const ad of p.advDetails) {
                    if (ad._id && ad.amount) {
                        try {
                            const adv = await AssignedAdvance.findById(ad._id);
                            if (adv) {
                                adv.amountPaid = (adv.amountPaid || 0) + ad.amount;
                                adv.balanceAmount = (adv.balanceAmount || 0) - ad.amount;
                                if (adv.balanceAmount <= 0) {
                                    adv.balanceAmount = 0;
                                    adv.status = 'Paid';
                                }
                                await adv.save();
                            }
                        } catch (err) {
                            console.error(`Error updating advance ${ad._id} during payrun finalize:`, err);
                        }
                    }
                }
            }
        }

        res.json({ success: true, message: `Successfully finalized payrun for ${month} ${year}` });
    } catch (e) {
        console.error('Finalize payrun error:', e);
        res.status(500).json({ error: 'Failed to finalize payrun' });
    }
});

router.get('/salary-report', async (req, res) => {
    try {
        const { startMonth, startYear, endMonth, endYear, reportType, empCode } = req.query;
        if (!startMonth || !startYear || !endMonth || !endYear || !reportType) return res.status(400).json({ error: 'Missing required parameters' });

        // Query all payslips from the relevant years to filter in memory for month ranges
        const yearCondition = (startYear === endYear) ? { year: startYear } : { year: { $gte: startYear, $lte: endYear } };
        
        let query = { ...yearCondition };
        
        if (reportType === 'employee') {
            if (!empCode) return res.status(400).json({ error: 'empCode required for employee report' });
            // We use empName or email in Payslip since empCode might not be stored. Wait, Payslip doesn't store empCode. We need to fetch applicant.
            const applicant = await Applicant.findOne({ empCode });
            if (!applicant) return res.status(404).json({ error: 'Employee not found' });
            query.email = applicant.email;
        }

        const payslips = await Payslip.find(query).lean();

        const monthMap = { 'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6, 'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12 };

        const startIdx = parseInt(startYear) * 12 + monthMap[startMonth.toLowerCase()];
        const endIdx = parseInt(endYear) * 12 + monthMap[endMonth.toLowerCase()];

        const filtered = payslips.filter(p => {
            const pIdx = parseInt(p.year) * 12 + monthMap[p.month.toLowerCase()];
            return pIdx >= startIdx && pIdx <= endIdx;
        });

        // Add empCode to results to match excel layout if we can
        let applicantMap = {};
        if (reportType === 'company') {
            const applicants = await Applicant.find().lean();
            applicants.forEach(a => { applicantMap[a.email] = a.empCode; });
        }

        const formatted = filtered.map(p => ({
            ...p,
            empCode: reportType === 'employee' ? empCode : (applicantMap[p.email] || 'NA'),
            calculatedSalaryBreakup: typeof p.calculatedSalaryBreakup === 'string' ? JSON.parse(p.calculatedSalaryBreakup) : p.calculatedSalaryBreakup
        }));

        formatted.sort((a, b) => {
            const aIdx = parseInt(a.year) * 12 + monthMap[a.month.toLowerCase()];
            const bIdx = parseInt(b.year) * 12 + monthMap[b.month.toLowerCase()];
            return aIdx - bIdx; // Ascending chronological order
        });

        res.json({ success: true, data: formatted });
    } catch (e) {
        console.error('Salary report error:', e);
        res.status(500).json({ error: 'Failed to generate salary report' });
    }
});

router.post('/wipe-payrun', async (req, res) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) return res.status(400).json({ error: 'Month and year required' });

        await Payslip.deleteMany({
            month: { $regex: new RegExp(`^${month}$`, 'i') },
            year: year
        });

        const filePath = path.join(__dirname, '../Attendance/LATEST_ATTENDANCE.xlsx');
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch(e) {
                console.error("Failed to delete LATEST_ATTENDANCE.xlsx:", e);
            }
        }

        const allApplicants = await Applicant.find({});
        const zeroedPreviews = allApplicants.map(applicant => ({
            empName: applicant.fullName,
            empCode: applicant.empCode,
            email: applicant.email,
            designation: applicant.designation || 'NA',
            department: applicant.department || 'NA',
            division: applicant.division || 'NA',
            uanNumber: applicant.uanNumber || 'NA',
            epfNumber: applicant.epfNumber || 'NA',
            esiNumber: applicant.esiNumber || 'NA',
            fatherName: applicant.formData?.fatherName || 'NA',
            panNumber: applicant.formData?.panNumber || 'NA',
            bankName: applicant.formData?.bankName || 'NA',
            accNo: applicant.formData?.accNo || 'NA',
            ifsc: applicant.formData?.ifsc || 'NA',
            present: 0, absent: 0, leave: 0, holiday: 0,
            payableDays: 0, totalMonthDays: 0,
            basicFixed: 0,
            hra: 0,
            specialAllow: 0,
            convAllow: 0,
            medical: 0,
            educAllow: 0,
            lta: 0,
            fixedAllow: 0,
            grossEarnings: 0,
            ptDeduction: 0,
            pfDeduction: 0,
            salDed: 0,
            expense: 0,
            penaltyDays: 0,
            finalSalary: 0,
            baseNetSalary: 0,
            loanDetails: [],
            advanceDetails: [],
            sendEmail: true
        }));

        res.json({ success: true, zeroedPreviews });
    } catch (e) {
        console.error('Failed to wipe payrun', e);
        res.status(500).json({ error: 'Failed to wipe payrun' });
    }
});

router.post('/email-payslips', async (req, res) => {
    try {
        const { emails, message, month, year } = req.body;
        if (!emails || !emails.length) return res.status(400).json({ error: 'No emails provided.' });

        const emailMonth = month || new Date().toLocaleString('default', { month: 'long' });
        const emailYear = year || new Date().getFullYear().toString();

        const transporter = require('nodemailer').createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let sentCount = 0;
        for (const item of emails) {
            if (!item.email || !item.pdfBase64) continue;
            
            const pdfBuffer = Buffer.from(item.pdfBase64.split('base64,')[1] || '', 'base64');
            
            const mailOptions = {
                from: process.env.EMAIL_FROM || '"Emyris HR" <hradmin@emyrishr.in>',
                to: item.email,
                subject: `Salary Slip - ${emailMonth} ${emailYear}`,
                text: message || 'Please find attached your salary slip for this month.',
                attachments: [
                    {
                        filename: `Salary_Slip_${item.empName.replace(/\s+/g, '_')}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };
            
            await transporter.sendMail(mailOptions);
            sentCount++;
        }
        
        res.json({ success: true, count: sentCount });
    } catch (e) {
        console.error('Email payslips error:', e);
        res.status(500).json({ error: 'Failed to send emails' });
    }
});

// --- LEAVE MANAGEMENT ---
router.get('/leave-types', async (req, res) => {
    try {
        const types = await LeaveType.find({});
        res.json({ success: true, types });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

router.post('/leave-types', async (req, res) => {
    try {
        const type = await LeaveType.create(req.body);
        res.json({ success: true, type });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

router.delete('/leave-types/:id', async (req, res) => {
    try {
        await LeaveType.deleteOne({ _id: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

router.put('/leave-types/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await LeaveType.updateOne({ _id: req.params.id }, { $set: { status } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

router.get('/leave-balances', async (req, res) => {
    try {
        const { email, year } = req.query;
        let query = {};
        if (email) query.employeeEmail = email;
        if (year) query.year = year;
        const balances = await LeaveBalance.find(query);
        res.json({ success: true, balances });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

router.post('/leave-balances', async (req, res) => {
    try {
        const { employeeEmail, year, leaveTypeId, leaveTypeName, assignedLeaves, usedLeaves } = req.body;
        
        let existing = await LeaveBalance.findOne({ employeeEmail, year, leaveTypeId });
        if (existing) {
            await LeaveBalance.updateOne(
                { _id: existing._id }, 
                { $set: { 
                    assignedLeaves: parseFloat(assignedLeaves),
                    usedLeaves: parseFloat(usedLeaves) || 0
                } }
            );
        } else {
            await LeaveBalance.create({
                employeeEmail,
                year,
                leaveTypeId,
                leaveTypeName,
                assignedLeaves: parseFloat(assignedLeaves),
                usedLeaves: parseFloat(usedLeaves) || 0
            });
        }
        res.json({ success: true });
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: 'Failed' });
    }
});

// Admin Leave Requests
router.get('/leave-requests', async (req, res) => {
    try {
        const requests = await LeaveRequest.find({});
        res.json({ success: true, requests });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch leave requests' });
    }
});

router.put('/leave-requests/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, year } = req.body;
        
        if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

        const request = await LeaveRequest.findById(id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        const oldStatus = request.status;
        request.status = status;
        await request.save();

        const isLWP = request.leaveTypeName.toLowerCase().includes('leave without pay') || request.leaveTypeName.toLowerCase().includes('lwp');

        const now = new Date();
        const calYear = now.getFullYear();
        const fyStart = now.getMonth() >= 3 ? calYear : calYear - 1;
        const defaultYear = `${fyStart}-${fyStart + 1}`;
        const targetYear = year || defaultYear;

        // If newly approved → increment usedLeaves
        if (status === 'Approved' && oldStatus !== 'Approved') {
            if (!isLWP) {
                const balance = await LeaveBalance.findOne({
                    employeeEmail: request.employeeEmail,
                    leaveTypeId: request.leaveTypeId,
                    year: targetYear
                });
                if (balance) {
                    balance.usedLeaves = (balance.usedLeaves || 0) + request.days;
                    await balance.save();
                }
            }
        }

        // If revoked from Approved → decrement usedLeaves back
        if (status === 'Revoked' && oldStatus === 'Approved') {
            if (!isLWP) {
                const balance = await LeaveBalance.findOne({
                    employeeEmail: request.employeeEmail,
                    leaveTypeId: request.leaveTypeId,
                    year: targetYear
                });
                if (balance) {
                    balance.usedLeaves = Math.max(0, (balance.usedLeaves || 0) - request.days);
                    await balance.save();
                }
            }
        }

        res.json({ success: true, request });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to update request status' });
    }
});

// ==========================================
// SUPPORT MANAGEMENT (LOANS & ADV. SALARY)
// ==========================================

// --- LOAN TYPES ---
router.get('/loan-types', async (req, res) => {
    try {
        const types = await LoanType.find();
        res.json({ success: true, types });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch loan types' });
    }
});

router.post('/loan-types', async (req, res) => {
    try {
        const { name, type, interestRate } = req.body;
        if (!name || !type) {
            return res.status(400).json({ success: false, message: 'Name and Type are required' });
        }
        const loanType = await LoanType.create({ name, type, interestRate: parseFloat(interestRate) || 0 });
        res.json({ success: true, loanType });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to create loan type' });
    }
});

router.put('/loan-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, interestRate, status } = req.body;
        const loanType = await LoanType.findById(id);
        if (!loanType) return res.status(404).json({ success: false, message: 'Loan type not found' });
        
        if (name) loanType.name = name;
        if (type) loanType.type = type;
        if (interestRate !== undefined) loanType.interestRate = parseFloat(interestRate);
        if (status) loanType.status = status;
        
        await loanType.save();
        res.json({ success: true, loanType });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to update loan type' });
    }
});

router.delete('/loan-types/:id', async (req, res) => {
    try {
        await LoanType.deleteOne({ _id: req.params.id });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to delete' });
    }
});

// --- ASSIGNED LOANS ---
router.get('/assigned-loans', async (req, res) => {
    try {
        const loans = await AssignedLoan.find();
        res.json({ success: true, loans });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch assigned loans' });
    }
});

router.post('/assigned-loans', async (req, res) => {
    try {
        const data = req.body;
        if (!data.employeeEmail || !data.employeeName || !data.loanName || !data.loanAmount || !data.installmentAmount || !data.deductionType || !data.deductionDate || !data.sanctionDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const assignedLoan = await AssignedLoan.create({
            employeeEmail: data.employeeEmail,
            employeeName: data.employeeName,
            loanName: data.loanName,
            interestRate: parseFloat(data.interestRate) || 0,
            nameOnPayslip: data.nameOnPayslip || 'Loan',
            loanAmount: parseFloat(data.loanAmount),
            installmentAmount: parseFloat(data.installmentAmount),
            deductionType: data.deductionType,
            deductionDate: data.deductionDate,
            sanctionDate: data.sanctionDate,
            amountPaid: 0,
            balanceAmount: parseFloat(data.loanAmount),
            status: 'Ongoing'
        });
        res.json({ success: true, assignedLoan });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to assign loan' });
    }
});

router.put('/assigned-loans/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const loan = await AssignedLoan.findById(id);
        if (!loan) return res.status(404).json({ success: false, message: 'Assigned loan not found' });
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                loan[key] = updates[key];
            }
        });
        await loan.save();
        res.json({ success: true, loan });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to update assigned loan' });
    }
});

router.delete('/assigned-loans/:id', async (req, res) => {
    try {
        await AssignedLoan.deleteOne({ _id: req.params.id });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to delete' });
    }
});

// --- ASSIGNED ADVANCES ---
router.get('/assigned-advances', async (req, res) => {
    try {
        const advances = await AssignedAdvance.find();
        res.json({ success: true, advances });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch assigned advances' });
    }
});

router.post('/assigned-advances', async (req, res) => {
    try {
        const data = req.body;
        if (!data.employeeEmail || !data.employeeName || !data.advanceAmount || !data.installmentAmount || !data.deductionType || !data.deductionMonth || !data.sanctionDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const advance = await AssignedAdvance.create({
            employeeEmail: data.employeeEmail,
            employeeName: data.employeeName,
            nameOnPayslip: data.nameOnPayslip || 'Salary Advance',
            advanceAmount: parseFloat(data.advanceAmount),
            installmentAmount: parseFloat(data.installmentAmount),
            deductionType: data.deductionType,
            deductionMonth: data.deductionMonth,
            sanctionDate: data.sanctionDate,
            amountPaid: 0,
            balanceAmount: parseFloat(data.advanceAmount),
            status: 'Ongoing'
        });
        res.json({ success: true, advance });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to assign advance' });
    }
});

router.put('/assigned-advances/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const advance = await AssignedAdvance.findById(id);
        if (!advance) return res.status(404).json({ success: false, message: 'Assigned advance not found' });
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                advance[key] = updates[key];
            }
        });
        await advance.save();
        res.json({ success: true, advance });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to update assigned advance' });
    }
});

router.delete('/assigned-advances/:id', async (req, res) => {
    try {
        await AssignedAdvance.deleteOne({ _id: req.params.id });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to delete' });
    }
});

// --- AREA CREATION (LOCATIONS) ROUTES ---



// State CRUD
router.get('/locations/states', async (req, res) => {
    try {
        const states = await XlState.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, states });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch states' });
    }
});

router.post('/locations/states', async (req, res) => {
    try {
        const { stateName } = req.body;
        const count = await XlState.count();
        const uid = 'STE' + (count + 1);
        const newState = await XlState.create({ stateName, uid });
        res.json({ success: true, state: newState });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to create state' });
    }
});

router.put('/locations/states/:id', async (req, res) => {
    try {
        await XlState.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to update state' });
    }
});

router.delete('/locations/states/:id', async (req, res) => {
    try {
        await XlState.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to delete state' });
    }
});

// HQ CRUD
router.get('/locations/hqs', async (req, res) => {
    try {
        const hqs = await XlHQ.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, hqs });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch HQs' });
    }
});

router.post('/locations/hqs', async (req, res) => {
    try {
        const { state, hqName } = req.body;
        const count = await XlHQ.count();
        const uid = 'HQS' + (count + 1);
        const newHQ = await XlHQ.create({ state, hqName, uid });
        res.json({ success: true, hq: newHQ });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to create HQ' });
    }
});

router.put('/locations/hqs/:id', async (req, res) => {
    try {
        await XlHQ.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to update HQ' });
    }
});

router.delete('/locations/hqs/:id', async (req, res) => {
    try {
        await XlHQ.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to delete HQ' });
    }
});

// City CRUD
router.get('/locations/cities', async (req, res) => {
    try {
        const cities = await XlCity.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, cities });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch cities' });
    }
});

router.post('/locations/cities', async (req, res) => {
    try {
        const { state, hq, cityName, areaType } = req.body;
        const count = await XlCity.count();
        const uid = 'CTY' + (count + 1);
        const newCity = await XlCity.create({ state, hq, cityName, uid, areaType });
        res.json({ success: true, city: newCity });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to create city' });
    }
});

router.put('/locations/cities/:id', async (req, res) => {
    try {
        await XlCity.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to update city' });
    }
});

router.delete('/locations/cities/:id', async (req, res) => {
    try {
        await XlCity.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to delete city' });
    }
});

// Route CRUD
router.get('/locations/routes', async (req, res) => {
    try {
        const routes = await XlRoute.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, routes });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch routes' });
    }
});

router.post('/locations/routes', async (req, res) => {
    try {
        const { state, hq, fromCity, toCity, areaType, distance } = req.body;
        const count = await XlRoute.count();
        const uid = 'RTE' + (count + 1);
        const newRoute = await XlRoute.create({ state, hq, fromCity, toCity, areaType, distance, uid });
        res.json({ success: true, route: newRoute });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to create route' });
    }
});

router.put('/locations/routes/:id', async (req, res) => {
    try {
        await XlRoute.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to update route' });
    }
});

router.delete('/locations/routes/:id', async (req, res) => {
    try {
        await XlRoute.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to delete route' });
    }
});

// =========================================================================
// XLA - Manage Users Endpoints (Divisions, Designations, Users, Admins)
// =========================================================================

// ---- Divisions ----
router.get('/locations/divisions', async (req, res) => {
    try {
        const divs = await XlDivision.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, divisions: divs });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/locations/divisions', async (req, res) => {
    try {
        const count = await XlDivision.count();
        const uid = 'DIV' + (count + 1);
        const div = await XlDivision.create({ ...req.body, uid });
        res.json({ success: true, division: div });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/locations/divisions/:id', async (req, res) => {
    try {
        await XlDivision.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/locations/divisions/:id', async (req, res) => {
    try {
        await XlDivision.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ---- Designations ----
router.get('/locations/designations', async (req, res) => {
    try {
        const dsgs = await XlDesignation.findAll({ order: [['level', 'ASC'], ['createdAt', 'DESC']] });
        res.json({ success: true, designations: dsgs });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/locations/designations', async (req, res) => {
    try {
        const count = await XlDesignation.count();
        const uid = 'DSG' + (count + 1);
        const dsg = await XlDesignation.create({ ...req.body, uid });
        res.json({ success: true, designation: dsg });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/locations/designations/:id', async (req, res) => {
    try {
        await XlDesignation.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/locations/designations/:id', async (req, res) => {
    try {
        await XlDesignation.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ---- Users ----
router.get('/users', async (req, res) => {
    try {
        const users = await XlUser.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, users });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/users', async (req, res) => {
    try {
        const count = await XlUser.count();
        const uid = 'USR' + (count + 1);
        const user = await XlUser.create({ ...req.body, uid });
        res.json({ success: true, user });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/users/:id', async (req, res) => {
    try {
        const oldUser = await XlUser.findByPk(req.params.id);
        const newEmail = req.body.email;
        
        if (oldUser && newEmail && oldUser.email !== newEmail) {
            const oldEmail = oldUser.email;
            const modelsToUpdate = [
                require('../db').XlLeave, require('../db').XlExpense, require('../db').XlDoctor,
                require('../db').XlChemist, require('../db').XlStockist, require('../db').XlCity,
                require('../db').XlRoute, require('../db').XlSample, require('../db').XlGift,
                require('../db').XlPrimarySales, require('../db').XlSecondarySales, require('../db').XlGeoFencing,
                require('../db').XlNotification, require('../db').XlCallPlan, require('../db').XlPerformanceAnalysis,
                require('../db').XlTarget, require('../db').XlDCR, require('../db').XlAttendance
            ];
            
            for (const Model of modelsToUpdate) {
                if (Model && Model.rawAttributes && Model.rawAttributes.employeeEmail) {
                    await Model.update({ employeeEmail: newEmail }, { where: { employeeEmail: oldEmail } });
                }
                if (Model && Model.name === 'xl_dcr' && Model.rawAttributes.userEmail) {
                    await Model.update({ userEmail: newEmail }, { where: { userEmail: oldEmail } });
                }
                if (Model && Model.name === 'xl_attendance' && Model.rawAttributes.userEmail) {
                    await Model.update({ userEmail: newEmail }, { where: { userEmail: oldEmail } });
                }
            }
        }
        
        await XlUser.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await XlUser.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ---- Admins ----
router.get('/admins', async (req, res) => {
    try {
        const admins = await XlAdmin.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, admins });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/admins', async (req, res) => {
    try {
        const count = await XlAdmin.count();
        const uid = 'ADM' + (count + 1);
        const admin = await XlAdmin.create({ ...req.body, uid });
        res.json({ success: true, admin });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/admins/:id', async (req, res) => {
    try {
        await XlAdmin.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/admins/:id', async (req, res) => {
    try {
        await XlAdmin.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- MANAGE PRODUCTS ---
const { XlProductCategory, XlProductType, XlProduct, XlProductSupplier, XlInventory } = require('../db');

// Category
router.get('/products/categories', async (req, res) => {
    try {
        const categories = await XlProductCategory.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, categories });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/products/categories', async (req, res) => {
    try {
        const count = await XlProductCategory.count();
        const uid = `CAT${count + 1}`;
        const category = await XlProductCategory.create({ ...req.body, uid });
        res.json({ success: true, category });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.put('/products/categories/:id', async (req, res) => {
    try {
        await XlProductCategory.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/products/categories/:id', async (req, res) => {
    try {
        await XlProductCategory.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Type
router.get('/products/types', async (req, res) => {
    try {
        const types = await XlProductType.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, types });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/products/types', async (req, res) => {
    try {
        const count = await XlProductType.count();
        const uid = `TYP${count + 1}`;
        const type = await XlProductType.create({ ...req.body, uid });
        res.json({ success: true, type });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.put('/products/types/:id', async (req, res) => {
    try {
        await XlProductType.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/products/types/:id', async (req, res) => {
    try {
        await XlProductType.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Supplier
router.get('/products/suppliers', async (req, res) => {
    try {
        const suppliers = await XlProductSupplier.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, suppliers });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/products/suppliers', async (req, res) => {
    try {
        const count = await XlProductSupplier.count();
        const uid = `SUP${count + 1}`;
        const supplier = await XlProductSupplier.create({ ...req.body, uid });
        res.json({ success: true, supplier });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.put('/products/suppliers/:id', async (req, res) => {
    try {
        await XlProductSupplier.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/products/suppliers/:id', async (req, res) => {
    try {
        await XlProductSupplier.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Product
router.get('/products', async (req, res) => {
    try {
        const products = await XlProduct.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, products });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/products', async (req, res) => {
    try {
        const count = await XlProduct.count();
        const uid = `PDT${count + 1}`;
        const product = await XlProduct.create({ ...req.body, uid, stock: 0 });
        res.json({ success: true, product });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.put('/products/:id', async (req, res) => {
    try {
        await XlProduct.update(req.body, { where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.delete('/products/:id', async (req, res) => {
    try {
        await XlProduct.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Inventory
router.get('/products/inventory', async (req, res) => {
    try {
        const inventory = await XlInventory.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, inventory });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
router.post('/products/inventory', async (req, res) => {
    try {
        const inv = await XlInventory.create(req.body);
        if (req.body.product && req.body.quantity) {
            const product = await XlProduct.findOne({ where: { productName: req.body.product } });
            if (product) {
                await product.update({ stock: product.stock + parseInt(req.body.quantity) });
            }
        }
        res.json({ success: true, inventory: inv });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- MANAGE ALLOWANCES ---
const { XlTravelAllowance, XlOutStationAllowance } = require('../db');

router.get('/allowances/travel', async (req, res) => {
    try {
        const allowances = await XlTravelAllowance.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, allowances });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/allowances/travel', async (req, res) => {
    try {
        const allowance = await XlTravelAllowance.create(req.body);
        res.json({ success: true, allowance });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/allowances/travel/:id', async (req, res) => {
    try {
        await XlTravelAllowance.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/allowances/outstation', async (req, res) => {
    try {
        const allowances = await XlOutStationAllowance.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, allowances });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/allowances/outstation', async (req, res) => {
    try {
        const allowance = await XlOutStationAllowance.create(req.body);
        res.json({ success: true, allowance });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/allowances/outstation/:id', async (req, res) => {
    try {
        await XlOutStationAllowance.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- DCS MANAGEMENT ---
const { XlDoctor, XlChemist, XlStockist, XlDoctorControl } = require('../db');


async function getMaxUID(Model, prefix) {
  const records = await Model.findAll({ attributes: ['uid'] });
  let max = 0;
  for (let r of records) {
    if (r.uid && r.uid.startsWith(prefix)) {
      const num = parseInt(r.uid.substring(prefix.length)) || 0;
      if (num > max) max = num;
    }
  }
  return max;
}

async function getMaxDoctorCode(Model) {
  const records = await Model.findAll({ attributes: ['doctorCode'] });
  let max = 0;
  for (let r of records) {
    if (r.doctorCode && r.doctorCode.startsWith('DOC')) {
      const num = parseInt(r.doctorCode.substring(3)) || 0;
      if (num > max) max = num;
    }
  }
  return max;
}

async function generateUID(Model, prefix) {
  const records = await Model.findAll({ attributes: ['uid'] });
  let max = 0;
  for (let r of records) {
    if (r.uid && r.uid.startsWith(prefix)) {
      const num = parseInt(r.uid.substring(prefix.length)) || 0;
      if (num > max) max = num;
    }
  }
  return prefix + (max + 1);
}

router.get('/dcs/doctors', async (req, res) => { try { const docs = await XlDoctor.findAll({ order: [['excelRowIndex', 'ASC'], ['createdAt', 'DESC']] }); res.json({ success: true, doctors: docs }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.post('/dcs/doctors', async (req, res) => { try { const data = req.body; if (!data.uid) data.uid = await generateUID(XlDoctor, 'DOC'); const doc = await XlDoctor.create(data); res.json({ success: true, doctor: doc }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.delete('/dcs/doctors/:id', async (req, res) => { try { await XlDoctor.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });

router.get('/dcs/chemists', async (req, res) => { try { const docs = await XlChemist.findAll({ order: [['excelRowIndex', 'ASC'], ['createdAt', 'DESC']] }); res.json({ success: true, chemists: docs }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.post('/dcs/chemists', async (req, res) => { try { const data = req.body; if (!data.uid) data.uid = await generateUID(XlChemist, 'CHM'); const doc = await XlChemist.create(data); res.json({ success: true, chemist: doc }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.delete('/dcs/chemists/:id', async (req, res) => { try { await XlChemist.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });

router.get('/dcs/stockists', async (req, res) => { try { const docs = await XlStockist.findAll({ order: [['excelRowIndex', 'ASC'], ['createdAt', 'DESC']] }); res.json({ success: true, stockists: docs }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.post('/dcs/stockists', async (req, res) => { try { const data = req.body; if (!data.uid) data.uid = await generateUID(XlStockist, 'STK'); const doc = await XlStockist.create(data); res.json({ success: true, stockist: doc }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.delete('/dcs/stockists/:id', async (req, res) => { try { await XlStockist.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });

router.get('/dcs/controls', async (req, res) => { try { const controls = await XlDoctorControl.findAll(); res.json({ success: true, controls }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.post('/dcs/controls', async (req, res) => { try { const c = await XlDoctorControl.create(req.body); res.json({ success: true, control: c }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.delete('/dcs/controls/:id', async (req, res) => { try { await XlDoctorControl.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });

const upload = multer({ dest: 'uploads/' });

router.post('/dcs/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const type = req.body.type;
    const targetHq = req.body.hq;
    if (!type || !targetHq) throw new Error('Missing type or HQ');
    
    const wb = require('xlsx').readFile(req.file.path);
    const data = require('xlsx').utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    if (!data || data.length === 0) throw new Error('Empty or invalid excel file');

    let currentUidMax = 0;
    let currentDocCodeMax = 0;
    const { XlDoctor, XlChemist, XlStockist } = require('../db');

    if (type === 'Doctor') {
      currentUidMax = await getMaxUID(XlDoctor, 'DOC');
      currentDocCodeMax = await getMaxDoctorCode(XlDoctor);
    } else if (type === 'Chemist') {
      currentUidMax = await getMaxUID(XlChemist, 'CHM');
    } else if (type === 'Stockist') {
      currentUidMax = await getMaxUID(XlStockist, 'STK');
    }

    const docs = [];
    let index = 0;
    for (let d of data) {
      let row = { headquarter: targetHq, status: 'Pending', excelRowIndex: index + 1 };
      
      row.updateAt = new Date().toLocaleString();

      if (type === 'Doctor') {
        if (!d.UID && !d.uid) {
            currentUidMax++;
            row.uid = 'DOC' + currentUidMax;
        } else {
            row.uid = d.UID || d.uid;
        }

        row.name = d.Name || d.name || '';
        row.degree = d.Degree || d.degree || '';
        row.specialization = d.Specialization || d.specialization || '';
        row.hospital = d.Hospital || d.hospital || '';
        row.mobile = String(d.Mobile || d.mobile || '');
        row.clinicContact = String(d['Clinic Contact'] || d.clinicContact || '');
        
        if (!d['Doctor Code'] && !d.doctorCode) {
            currentDocCodeMax++;
            row.doctorCode = 'DOC' + currentDocCodeMax.toString().padStart(3, '0');
        } else {
            row.doctorCode = String(d['Doctor Code'] || d.doctorCode || '');
        }

        row.category = d.Category || d.category || '';
        row.address = d.Address || d.address || '';
        row.workingArea = d['Working Area'] || d.workingArea || '';
        row.birthday = d.Birthday || d.birthday || '';
        row.anniversary = d.Anniversary || d.anniversary || '';
        row.email = d.Email || d.email || '';
        row.contact = String(d.Contact || d.contact || '');
        row.extraInformation = d['Extra Information'] || d.extraInformation || '';
      }
      if (type === 'Chemist') {
        if (!d.UID && !d.uid) {
            currentUidMax++;
            row.uid = 'CHM' + currentUidMax;
        } else {
            row.uid = d.UID || d.uid;
        }
        row.businessName = d['Business Name'] || d.businessName || d.Name || d.name || '';
        row.proprietorName = d['Proprietor Name'] || d.proprietorName || '';
        row.mobile = String(d.Mobile || d.mobile || '');
        row.email = d.Email || d.email || '';
        row.address = d.Address || d.address || '';
        row.workingArea = d['Working Area'] || d.workingArea || '';
        row.birthday = d.Birthday || d.birthday || '';
        row.certifications = d.Certifications || d.certifications || '';
        row.extraInformation = d['Extra Information'] || d.extraInformation || '';
      }
      if (type === 'Stockist') {
        if (!d.UID && !d.uid) {
            currentUidMax++;
            row.uid = 'STK' + currentUidMax;
        } else {
            row.uid = d.UID || d.uid;
        }
        row.businessName = d['Business Name'] || d.businessName || d.Name || d.name || '';
        row.name = d['Proprietor Name'] || d.name || '';
        row.mobile = String(d.Mobile || d.mobile || '');
        row.email = d.Email || d.email || '';
        row.gst = String(d.GST || d.gst || '');
        row.drugLicense = String(d['Drug License'] || d.drugLicense || '');
        row.address = d.Address || d.address || '';
        row.workingArea = d['Working Area'] || d.workingArea || '';
        row.certifications = d.Certifications || d.certifications || '';
        row.extraInformation = d['Extra Information'] || d.extraInformation || '';
      }
      
      docs.push(row);
      
      if (type === 'Doctor') {
        const ex = await XlDoctor.findOne({ where: { uid: row.uid } });
        if (ex) await ex.update(row); else await XlDoctor.create(row);
      }
      if (type === 'Chemist') {
        const ex = await XlChemist.findOne({ where: { uid: row.uid } });
        if (ex) await ex.update(row); else await XlChemist.create(row);
      }
      if (type === 'Stockist') {
        const ex = await XlStockist.findOne({ where: { uid: row.uid } });
        if (ex) await ex.update(row); else await XlStockist.create(row);
      }
      
      index++;
    }

    res.json({ success: true, count: docs.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// -------------------------------------------------------------
// TARGETS API (XLA)
// -------------------------------------------------------------

router.get('/targets', async (req, res) => {
    try {
        const { period, month, year } = req.query;
        let where = {};
        if (period) where.targetPeriod = period;
        if (month) where.month = month;
        if (year) where.year = year;
        
        const targets = await XlTarget.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ success: true, targets });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/targets', async (req, res) => {
    try {
        const { userEmail, userName, targetPeriod, month, year, allocationType, lumpSumAmount, productTargets, totalProductAmount } = req.body;
        
        const whereClause = { userEmail, targetPeriod, year };
        if (targetPeriod === 'Monthly') {
            whereClause.month = month;
        }
        
        await XlTarget.destroy({ where: whereClause });
        
        const newTarget = await XlTarget.create({
            userEmail, userName, targetPeriod, month: targetPeriod === 'Monthly' ? month : null, year, allocationType, lumpSumAmount, productTargets, totalProductAmount
        });
        
        res.json({ success: true, target: newTarget });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/targets/:id', async (req, res) => {
    try {
        await XlTarget.destroy({ where: { _id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;


