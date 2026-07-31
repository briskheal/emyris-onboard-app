const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Company, Applicant, Question, ExamResult, Asset, Division, HQ, TemplateHistory, sequelize } = require('../db');

const BASE_URL = process.env.BASE_URL || 'https://emyrishr.in';

const { sendEmail } = require('../utils/mailer');
const { syncActiveExamForApplicant } = require('../utils/examSync');
const sharp = require('sharp');

// Shared file helper (Converts images to WebP using sharp; leaves PDF documents intact)
async function saveBase64ToFile(email, category, base64Data) {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:')) {
        return base64Data;
    }
    try {
        const splitIdx = base64Data.indexOf(';base64,');
        if (splitIdx === -1) return base64Data;
        
        const mimeType = base64Data.substring(5, splitIdx).toLowerCase();
        let ext = mimeType.split('/')[1] || 'bin';
        
        // Handle common long extension names
        if (mimeType.includes('wordprocessingml')) ext = 'docx';
        if (mimeType.includes('spreadsheetml')) ext = 'xlsx';
        if (mimeType.includes('presentationml')) ext = 'pptx';
        
        const dir = path.join(__dirname, '..', 'uploads', email.replace('@', '_'));
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const safeCategory = category.replace(/[\/\\]/g, '_');
        
        const base64Content = base64Data.substring(splitIdx + 8);
        let buffer = Buffer.from(base64Content, 'base64');
        
        // Convert raster images (png, jpeg, jpg, webp, bmp, tiff) to optimized WebP format
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


// Number to words helper
function numberToWords(n) {
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
        'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if (n === 0) return 'Zero';
    if (n < 0) return 'Negative ' + numberToWords(-n);
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + numberToWords(n%100) : '');
    if (n < 100000) return numberToWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + numberToWords(n%1000) : '');
    if (n < 10000000) return numberToWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + numberToWords(n%100000) : '');
    return numberToWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + numberToWords(n%10000000) : '');
}

// Template resolver helper
function resolveTemplate(template, data) {
    if (!template) return '';
    return template.replace(/{{(w+)}}/g, (match, key) => data[key] !== undefined ? data[key] : match);
}

router.post('/sync-exam', async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });
        email = email.toString().toLowerCase().trim();
        let applicants = await Applicant.find({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
        if (!applicants || applicants.length === 0) {
            applicants = await Applicant.find({ email });
        }
        if (!applicants || applicants.length === 0) return res.status(404).json({ success: false, message: 'Applicant not found' });
        
        let applicant = applicants[0];
        applicant = await syncActiveExamForApplicant(applicant);
        return res.json({ success: true, applicant });
    } catch (err) {
        console.error('Error syncing exam:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

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

        await syncActiveExamForApplicant(applicant);

        res.status(200).json({
            success: true,
            applicant: {
                fullName: applicant.fullName,
                email: applicant.email,
                phone: applicant.phone,
                status: applicant.status,
                formData: applicant.formData,
                documents: applicant.documents || [],
                pendingExams: applicant.pendingExams || [],
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
                rapidTestCompleted: applicant.rapidTestCompleted,
                psychometricTestCompleted: applicant.psychometricTestCompleted,
                psychometricScores: applicant.psychometricScores,
                mindsetReport: applicant.mindsetReport,
                issuedLetters: applicant.issuedLetters || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login error.' });
    }
});

router.all(['/profile/:email', '/profile', '/applicant-profile/:email'], async (req, res) => {
    try {
        const email = req.params.email || req.query.email || req.body?.email;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });
        return res.json({ success: true, applicant });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
});

router.all(['/test-questions', '/start-rapid-fire', '/start-rapid-fire/:email'], async (req, res) => {
    try {
        const email = req.params.email || req.query.email || req.body?.email;
        if (email) {
            const applicant = await Applicant.findOne({ email });
            if (applicant && applicant.rapidTestCompleted) {
                return res.status(400).json({ success: false, error: 'Rapid Fire screening test is already completed.' });
            }
        }
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
        res.json({ success: true, rapidTime: company?.rapidTestTime || 25, timeLimitMinutes: company?.rapidTestTime || 25, questions: safeQuestions.sort(() => 0.5 - Math.random()) });
    } catch (e) {
        console.error('Fetch Test Error:', e);
        res.status(500).json({ error: 'Failed to fetch test' });
    }
});

router.post(['/submit-test', '/submit-rapid-fire'], async (req, res) => {
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
            if (q) {
                if (q.correctAnswerIndex === Number(selectedIdx) || (q.options && q.options[q.correctAnswerIndex] === selectedIdx)) {
                    score++;
                }
            }
        }
        
        await Applicant.updateOne({ _id: applicant._id }, { $set: { rapidTestScore: score, rapidTestCompleted: true } });
        
        try {
            await ExamResult.create({
                email: applicant.email,
                name: applicant.fullName || applicant.email,
                hq: applicant.hq || '',
                division: applicant.division || '',
                examDate: new Date().toISOString().split('T')[0],
                submittedAt: new Date(),
                testedProduct: '🎯 Phase 1: Rapid Fire Screening Test',
                totalQuestions: 20,
                autoScore: score,
                manualScore: 0,
                totalScore: score,
                status: 'graded',
                answers: answers || {}
            });
        } catch (err) {
            console.error('Failed to create ExamResult for Rapid Fire:', err);
        }
        
        res.json({ success: true, score });
    } catch (e) {
        console.error('Submit Test Error:', e);
        res.status(500).json({ error: 'Failed to submit test' });
    }
});

// --- 30-ITEM PSYCHOMETRIC & MINDSET ASSESSMENT QUESTION BANK ---
const PSYCHOMETRIC_QUESTIONS_30 = [
    // Dimension 1: Clinical Integrity & Ethics (Honesty & Compliance)
    {
        _id: 'psy_1', dimension: 'Clinical Integrity & Ethics',
        text: 'A senior cardiologist asks if ALOMOS GOLD can be used for a condition where clinical trial data is currently inconclusive. How do you respond?',
        options: [
            'Agree enthusiastically to secure immediate hospital formulary approval.',
            'Strictly state what the scientific trials support and offer to provide published monographs.',
            'Emphasize the positive general nutrition profile and gently redirect to approved indications.',
            'Mention that while not officially indicated, some doctors observe anecdotal benefits.'
        ],
        weights: [1, 5, 3, 2]
    },
    {
        _id: 'psy_2', dimension: 'Clinical Integrity & Ethics',
        text: 'During a competitive hospital tender presentation, your colleague suggests slightly exaggerating a competitor\'s side-effect rates to win the listing. What do you do?',
        options: [
            'Stay neutral — your colleague\'s presentation style is their own responsibility.',
            'Go along with the suggestion since you believe the competitor has higher unreported side effects anyway.',
            'Refuse firmly and insist on verified clinical head-to-head comparative data only.',
            'Suggest toning it down slightly — minor emphasis is standard industry practice.'
        ],
        weights: [2, 1, 5, 1]
    },
    {
        _id: 'psy_3', dimension: 'Clinical Integrity & Ethics',
        text: 'Your area manager calls and says a key hospital formulary committee meets tomorrow. He asks you to back-date 3 doctor visit entries in your CRM that you missed this week to show consistent engagement. What do you do?',
        options: [
            'Record all 3 visits as requested — a formulary listing is too critical to risk.',
            'Refuse, explain the audit and compliance risks clearly, and offer to prepare extra clinical material for tomorrow instead.',
            'Ask your manager to send the instruction in writing before you act on it.',
            'Record 1 or 2 visits as a compromise to partially satisfy the manager.'
        ],
        weights: [1, 5, 3, 1]
    },
    {
        _id: 'psy_4', dimension: 'Clinical Integrity & Ethics',
        text: 'A hospital stockist requests back-dated invoices for promotional sample distributions. How do you handle this?',
        options: [
            'Consult your regional sales manager immediately before making any commitments.',
            'Accommodate the request — maintaining distributor goodwill is critical for supply continuity.',
            'Try to find a middle ground by adjusting future delivery documentation.',
            'Decline immediately, citing strict audit and compliance policies clearly.'
        ],
        weights: [4, 1, 2, 5]
    },
    {
        _id: 'psy_5', dimension: 'Clinical Integrity & Ethics',
        text: 'It is month-end evening. Your area manager texts: "Just mark 3 more doctor calls in CRM to meet your daily average — nobody audits these entries anyway." What do you do?',
        options: [
            'Mark the 3 calls — month-end pressure is real and this is common practice.',
            'Decline firmly, explain that false CRM entries violate audit policy, and record only actual completed calls.',
            'Mark just 1 extra call as a compromise to avoid conflict with the manager.',
            'Ask your manager to confirm the instruction on a recorded medium before you act.'
        ],
        weights: [1, 5, 1, 3]
    },

    // Dimension 2: Resilience & Grit Under Pressure
    {
        _id: 'psy_6', dimension: 'Resilience & Grit Under Pressure',
        text: 'After waiting 2.5 hours outside the ICU, the head surgeon abruptly cancels your meeting due to an emergency surgery. How do you react?',
        options: [
            'Accept the situation professionally and use the time productively by meeting resident doctors or the pharmacy team.',
            'Consider this hospital too difficult to penetrate and shift focus to more accessible clinics for now.',
            'Feel frustrated about the wasted time but plan to catch the doctor briefly in the corridor tomorrow.',
            'Call the ward secretary immediately to reschedule, while mentally noting the doctor as low-priority.'
        ],
        weights: [5, 1, 2, 3]
    },
    {
        _id: 'psy_7', dimension: 'Resilience & Grit Under Pressure',
        text: 'Your newly launched ALOMOS GOLD formula faces unexpected skepticism from key opinion leaders (KOLs) who question the research quality. What is your mindset?',
        options: [
            'Wait several weeks for other doctors to adopt the formula before re-approaching skeptical KOLs.',
            'View the skepticism as an intellectual invitation to present deeper clinical evidence and mechanism data.',
            'Focus all promotion on doctors who readily accept new supplements without questioning.',
            'Request senior management intervention for co-detailing to address specific clinical queries.'
        ],
        weights: [2, 5, 1, 3]
    },
    {
        _id: 'psy_8', dimension: 'Resilience & Grit Under Pressure',
        text: 'You miss your quarterly territory milestone by 8% due to unforeseen hospital supply chain disruptions. How do you process this?',
        options: [
            'Review call patterns, identify coverage gaps, and build a structured recovery action plan for next quarter.',
            'Feel discouraged and wait for management to revise targets to a more realistic level.',
            'Accept that supply disruptions were external and beyond personal control — reset expectations naturally.',
            'Accelerate detailing in a new sub-territory to aggressively compensate for the shortfall.'
        ],
        weights: [5, 1, 3, 4]
    },
    {
        _id: 'psy_9', dimension: 'Resilience & Grit Under Pressure',
        text: 'During a live hospital CME, a senior doctor challenges the statistical significance of your clinical trial data in front of 15 peers. How do you respond?',
        options: [
            'Deflect the question gracefully and continue to the next presentation slide to avoid disruption.',
            'Maintain complete poise, acknowledge the valid clinical perspective, and clearly explain the study design and p-value.',
            'Become firm and reassert that the brand is endorsed by leading national specialists.',
            'Politely note the observation and offer to email the complete medical affairs dossier after the session.'
        ],
        weights: [1, 5, 1, 4]
    },
    {
        _id: 'psy_10', dimension: 'Resilience & Grit Under Pressure',
        text: 'It is Friday evening. You have had 4 consecutive days with zero confirmed prescriptions and 3 cancelled appointments. Monday is a fresh week. How do you spend your Saturday?',
        options: [
            'Rest and recharge fully — mental health is as important as performance.',
            'Review your territory data, identify why calls did not convert, and prepare a sharper opening strategy for Monday.',
            'Call your manager for a motivation check-in and to discuss whether targets need recalibration.',
            'Reflect seriously on whether this field sales role is the right long-term fit for you.'
        ],
        weights: [3, 5, 2, 1]
    },

    // Dimension 3: Empathy & Relationship Building (EQ)
    {
        _id: 'psy_11', dimension: 'Empathy & Relationship Building',
        text: 'A pediatric consultant expresses deep frustration about gastrointestinal side effects they have observed with standard protein formulas. How do you approach your pitch?',
        options: [
            'Immediately present the product brochure highlighting the 5-in-1 GI-friendly formula features.',
            'Mention that GI issues are common across all protein supplements in the category.',
            'Actively listen to their specific patient struggles first, then introduce ALOMOS GOLD\'s DigeZyme and probiotic tolerability profile.',
            'Emphasize ALOMOS GOLD\'s taste and price benefits to steer the conversation away from the GI discussion.'
        ],
        weights: [3, 1, 5, 1]
    },
    {
        _id: 'psy_12', dimension: 'Empathy & Relationship Building',
        text: 'You notice a key hospital pharmacist looks visibly stressed and overwhelmed during your afternoon visit. What do you do?',
        options: [
            'Proceed with your standard 10-minute product presentation since you have a scheduled appointment.',
            'Postpone the visit entirely without asking if any urgent inventory replenishment is required.',
            'Ask briefly if stock replenishment is needed and leave flyers without taking further time.',
            'Offer brief cordial support, check if urgent stock matters need attention, and keep the interaction short and helpful.'
        ],
        weights: [1, 2, 3, 5]
    },
    {
        _id: 'psy_13', dimension: 'Empathy & Relationship Building',
        text: 'A senior oncologist says: "I appreciate your product, but my patients are immunocompromised post-chemotherapy. I need specific protein absorption data for this population before I prescribe." You respond:',
        options: [
            'Share the general protein efficacy data and highlight ALOMOS GOLD\'s taste advantage for patients with poor appetite.',
            'Acknowledge the specialized clinical context and commit to delivering a targeted oncology protein absorption study within 48 hours.',
            'Explain that ALOMOS GOLD is suitable for all adults and has an excellent general tolerability profile.',
            'Suggest the oncologist consult a clinical dietician for specialized cancer nutrition protocols.'
        ],
        weights: [2, 5, 1, 3]
    },
    {
        _id: 'psy_14', dimension: 'Empathy & Relationship Building',
        text: 'You are visiting a senior nephrologist who has prescribed a competitor protein supplement for 8 years and appears fully satisfied. How do you approach the call?',
        options: [
            'Present a detailed clinical comparison chart showing ALOMOS GOLD\'s superior protein efficiency over the competitor.',
            'Acknowledge their clinical experience, ask what outcomes they prioritize most for renal patients, and listen carefully before any positioning.',
            'Offer a free sample case and a special hospital pricing scheme to incentivize trial prescriptions.',
            'Focus your energy on other doctors in the hospital who are not yet committed to a competitor.'
        ],
        weights: [3, 5, 2, 1]
    },
    {
        _id: 'psy_15', dimension: 'Empathy & Relationship Building',
        text: 'A patient caregiver stops you in the hospital corridor and urgently asks for ALOMOS GOLD\'s recommended dosage for their recovering family member. How do you handle it?',
        options: [
            'Hand them a promotional leaflet and suggest they read the dosage information on the back panel.',
            'Provide empathetic general information while clearly advising them to verify dosing with their treating doctor.',
            'Give exact dosage recommendations directly based on the product insert — you know the formula thoroughly.',
            'Politely explain you speak only with medical professionals and suggest they wait for the doctor.'
        ],
        weights: [1, 5, 1, 3]
    },

    // Dimension 4: Autonomy & Self-Motivation (Drive)
    {
        _id: 'psy_16', dimension: 'Autonomy & Self-Motivation',
        text: 'Your reporting manager is traveling and unreachable during an unexpected hospital formulary submission deadline. What steps do you take?',
        options: [
            'Wait until your manager returns — taking sole responsibility for an unsupported submission is too risky.',
            'Request the hospital procurement officer for a deadline extension until your manager is available.',
            'Prepare all verified documents accurately and submit on time, informing your manager immediately via message.',
            'Ask a senior colleague to co-sign the submission to appropriately share the accountability.'
        ],
        weights: [2, 3, 5, 4]
    },
    {
        _id: 'psy_17', dimension: 'Autonomy & Self-Motivation',
        text: 'How do you structure your daily hospital detailing schedule when working independently in the field with no direct supervision?',
        options: [
            'Rely on hospital calls or distributor requests to guide which facilities to visit each day.',
            'Decide daily visits spontaneously each morning based on traffic conditions and personal energy.',
            'Follow a standard geographical hospital loop from morning to evening covering familiar accounts.',
            'Plan routes systematically by doctor OPD timings, account priority tiers, and weekly coverage targets.'
        ],
        weights: [1, 1, 3, 5]
    },
    {
        _id: 'psy_18', dimension: 'Autonomy & Self-Motivation',
        text: 'During a field visit, you discover a new private 80-bed nursing home not listed in your territory coverage master. What do you do?',
        options: [
            'Check whether a competitor is already visiting there before deciding if it is worth your time to explore.',
            'Note the address and raise it with your manager during the next monthly review meeting.',
            'Ignore it unless it is formally assigned during an official territory redistribution exercise.',
            'Proactively conduct an initial survey, meet the resident medical officer, and add it to your growth pipeline immediately.'
        ],
        weights: [2, 3, 1, 5]
    },
    {
        _id: 'psy_19', dimension: 'Autonomy & Self-Motivation',
        text: 'Medical Affairs shares a 40-slide technical training deck on a new clinical indication for ALOMOS GOLD on Sunday evening — your first hospital call on this topic is Monday morning. What do you do?',
        options: [
            'Attend using existing product knowledge — the new deck can be studied at the next official training session.',
            'Skim the most important slides and build an improvised pitch — good enough for a first exploratory call.',
            'Study the key clinical slides independently, practice pitch delivery, and walk in confident on Monday.',
            'Ask your manager to reschedule Monday\'s call to allow yourself proper preparation time.'
        ],
        weights: [1, 2, 5, 3]
    },
    {
        _id: 'psy_20', dimension: 'Autonomy & Self-Motivation',
        text: 'You consistently hit 115% of territory target. Your manager suggests you spend 2 hours per week mentoring a struggling colleague who hits 80%. How do you respond?',
        options: [
            'Agree enthusiastically — collective team performance strengthens the entire territory ecosystem.',
            'Politely decline — your own targets are your primary accountability and HR manages formal training.',
            'Accept but reduce your personal product study time to compensate for the mentoring commitment.',
            'Propose a structured monthly peer-learning session rather than weekly individual mentoring.'
        ],
        weights: [5, 1, 2, 4]
    },

    // Dimension 5: Scientific Adaptability (Learning Agility)
    {
        _id: 'psy_21', dimension: 'Scientific Adaptability',
        text: 'You are asked to detail ALOMOS GOLD\'s complex 5-in-1 clinical nutrition formula at a key hospital with only 24 hours of preparation time. How do you approach it?',
        options: [
            'Request a 48-hour extension from management to ensure complete pharmacological preparation.',
            'Deconstruct the 5 core clinical pillars and master the primary clinical hook immediately using all available resources.',
            'Detail only the general brand positioning until you feel fully comfortable with the technical complexities.',
            'Focus on memorizing the top 3 benefits and commit to reading the rest during transit between calls.'
        ],
        weights: [2, 5, 1, 3]
    },
    {
        _id: 'psy_22', dimension: 'Scientific Adaptability',
        text: 'A senior intensivist asks you to explain exactly how ALOMOS GOLD\'s whey protein fraction differs from casein-based formulas in nitrogen retention for critically ill patients. How do you respond?',
        options: [
            'Admit this level of protein fractionation is complex and commit to sending a targeted medical affairs response within 24 hours.',
            'Explain that ALOMOS GOLD uses a superior whey matrix optimized for bioavailability — clinical data clearly supports faster recovery.',
            'State that ALOMOS GOLD\'s full-spectrum protein profile is superior for ICU recovery and offer the clinical monograph.',
            'Clearly explain whey vs. casein nitrogen kinetics, referencing specific absorption rate differences and ICU clinical relevance with confidence.'
        ],
        weights: [4, 3, 2, 5]
    },
    {
        _id: 'psy_23', dimension: 'Scientific Adaptability',
        text: 'Your company introduces digital detailing iPads and AI voice scoring tools to replace paper brochures. How do you react?',
        options: [
            'Resist the digital transition — personal doctor interactions are best served through direct human engagement without technology barriers.',
            'Use digital tools when explicitly required by SOPs but continue preferring physical flipcharts whenever possible.',
            'Embrace the digital tools enthusiastically, practicing rapidly to elevate the quality of clinical engagement with doctors.',
            'Adopt the tools after attending all official company orientation sessions provided.'
        ],
        weights: [1, 2, 5, 3]
    },
    {
        _id: 'psy_24', dimension: 'Scientific Adaptability',
        text: 'At a hospital CME, a senior geriatrician asks: "What specific published evidence do you have on ALOMOS GOLD\'s efficacy in reducing sarcopenia progression in patients above 70 years?" How do you respond?',
        options: [
            'Highlight that ALOMOS GOLD is widely prescribed for senior citizens and has strong joint mobility and general wellness data.',
            'Connect muscle protein synthesis directly to sarcopenia prevention with confidence, citing clinical recovery timelines and evidence.',
            'Commit to sharing the specific geriatric clinical evidence package from medical affairs within 48 hours.',
            'Redirect the conversation to ALOMOS GOLD\'s general adult wellness and palatability benefits.'
        ],
        weights: [2, 5, 4, 1]
    },
    {
        _id: 'psy_25', dimension: 'Scientific Adaptability',
        text: 'Medical Affairs sends you a 12-page peer-reviewed clinical study on ALOMOS GOLD and post-surgical protein synthesis. You have 25 minutes before your next hospital appointment. What do you do?',
        options: [
            'Scan the executive summary, key efficacy tables, and p-values to build rapid, impactful clinical talking points.',
            'Read all 12 pages carefully — using incomplete knowledge in a doctor call is unprofessional.',
            'File it for weekend reading and use your existing materials for today\'s call.',
            'Hand the study directly to the doctor during the appointment — they can interpret it better than a summary from you.'
        ],
        weights: [5, 3, 2, 1]
    },

    // Dimension 6: Collaborative Communication (Team Play)
    {
        _id: 'psy_26', dimension: 'Collaborative Communication',
        text: 'A colleague on a shared hospital territory disagrees with your product positioning strategy during a joint preparation meeting. How do you resolve this?',
        options: [
            'Insist on your positioning approach since you have more recent doctor visit experience in this territory.',
            'Defer completely to your colleague\'s strategy to avoid friction before the joint call.',
            'Engage in open dialogue, evaluate both clinical angles, and align on a unified high-impact strategy together.',
            'Suggest splitting the hospital doctors so each can present their preferred approach independently.'
        ],
        weights: [1, 2, 5, 3]
    },
    {
        _id: 'psy_27', dimension: 'Collaborative Communication',
        text: 'During a regional conference, HR provides constructive feedback on your CRM reporting frequency, noting it is consistently below company standards. How do you receive it?',
        options: [
            'Accept the feedback calmly and ensure weekly CRM reports are submitted on schedule going forward.',
            'Feel that strong clinical sales results should outweigh administrative reporting formalities.',
            'Welcome the feedback with genuine appreciation, recognize its organizational value, and optimize your reporting routine immediately.',
            'Explain to HR that heavy fieldwork genuinely leaves limited time for detailed CRM administrative entries.'
        ],
        weights: [4, 1, 5, 2]
    },
    {
        _id: 'psy_28', dimension: 'Collaborative Communication',
        text: 'A new junior team member joins your division and struggles to grasp clinical detailing scripts. What do you do?',
        options: [
            'Encourage them to re-read the training manual and watch all official video recordings independently.',
            'Focus entirely on your own territory goals — HR and management are responsible for formal onboarding.',
            'Answer their specific questions whenever they reach out to you during your available time.',
            'Proactively offer mentorship, conduct practice mock calls together, and share successful detailing techniques.'
        ],
        weights: [2, 1, 3, 5]
    },
    {
        _id: 'psy_29', dimension: 'Collaborative Communication',
        text: 'A sudden demand spike in a key hospital creates a potential stock-out risk for ALOMOS GOLD. How do you coordinate with the supply chain team?',
        options: [
            'Expect the distributor to automatically manage buffer inventory — that is their contracted responsibility.',
            'Maintain transparent, proactive daily communication with the supply team, forecasting hospital needs clearly to prevent stock-outs.',
            'Inform the supply team once the hospital order is confirmed and track expected delivery dates.',
            'Escalate the stock risk to your area manager and let them handle distributor communication directly.'
        ],
        weights: [1, 5, 3, 2]
    },
    {
        _id: 'psy_30', dimension: 'Collaborative Communication',
        text: 'You are offered the highest-commission territory in your region, but it requires relocating to a semi-urban district with difficult hospital infrastructure and challenging doctor access. Your family is settled in your current city. You respond:',
        options: [
            'Accept the challenge with full commitment — difficult markets build the strongest clinical skills and deepest product champions.',
            'Request a 6-month trial period in the new territory before committing to full relocation.',
            'Propose a shared territory arrangement — alternating between both locations each week.',
            'Politely decline and request a different high-potential territory within your current city.'
        ],
        weights: [5, 4, 3, 2]
    }
];

router.all('/psychometric-questions', async (req, res) => {
    try {
        const email = req.params.email || req.query.email || req.body?.email;
        if (email) {
            const applicant = await Applicant.findOne({ email });
            if (applicant && applicant.psychometricTestCompleted) {
                return res.status(400).json({ success: false, error: 'Psychometric assessment is already completed.' });
            }
        }
        // Return all 30 questions randomized
        const safeQuestions = PSYCHOMETRIC_QUESTIONS_30.map(q => ({
            _id: q._id,
            dimension: q.dimension,
            text: q.text,
            options: q.options
        }));
        res.json({ success: true, timeLimitMinutes: 30, questions: safeQuestions.sort(() => 0.5 - Math.random()) });
    } catch (e) {
        console.error('Fetch Psychometric Questions Error:', e);
        res.status(500).json({ error: 'Failed to fetch psychometric questions' });
    }
});

router.post('/submit-psychometric', async (req, res) => {
    try {
        const { email, answers } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });
        
        if (applicant.psychometricTestCompleted) {
            return res.status(400).json({ error: 'Psychometric assessment already completed' });
        }

        // Calculate scores across the 6 dimensions
        const dimensionScores = {
            'Clinical Integrity & Ethics': { earned: 0, max: 25 },
            'Resilience & Grit Under Pressure': { earned: 0, max: 25 },
            'Empathy & Relationship Building': { earned: 0, max: 25 },
            'Autonomy & Self-Motivation': { earned: 0, max: 25 },
            'Scientific Adaptability': { earned: 0, max: 25 },
            'Collaborative Communication': { earned: 0, max: 25 }
        };

        let totalPointsEarned = 0;
        let totalPointsMax = 0;
        let answeredQuestions = 0;

        PSYCHOMETRIC_QUESTIONS_30.forEach(q => {
            const candidateAnswer = answers && answers[q._id] !== undefined ? answers[q._id] : null;
            let selectedIdx = -1;
            if (candidateAnswer !== null && candidateAnswer !== "") {
                answeredQuestions++;
                if (typeof candidateAnswer === 'number') {
                    selectedIdx = candidateAnswer;
                } else if (typeof candidateAnswer === 'string') {
                    // Match string answer against options array to find the index
                    selectedIdx = q.options.findIndex(opt => opt.trim() === candidateAnswer.trim());
                    // Fallback: try parsing as a number index
                    if (selectedIdx === -1 && !isNaN(parseInt(candidateAnswer))) {
                        selectedIdx = parseInt(candidateAnswer);
                    }
                }
            }
            const pts = (selectedIdx >= 0 && selectedIdx < q.weights.length) ? q.weights[selectedIdx] : 1;
            if (dimensionScores[q.dimension]) {
                dimensionScores[q.dimension].earned += pts;
            }
            totalPointsEarned += pts;
            totalPointsMax += 5; // max weight per question is 5
        });

        if (answeredQuestions === 0) {
            // Do not grade. Reset status to Pending so they can retake it.
            await Applicant.updateOne({ _id: applicant._id }, {
                $set: {
                    psychometricTestCompleted: false
                },
                $unset: {
                    psychometricScores: 1,
                    mindsetReport: 1
                }
            });
            return res.json({ success: true, warning: 'Submitted empty. Status reset to pending.' });
        }

        // Convert to percentages
        const traitPercentiles = {};
        for (const [dim, data] of Object.entries(dimensionScores)) {
            traitPercentiles[dim] = Math.min(100, Math.round((data.earned / data.max) * 100));
        }

        const overallPercentile = Math.min(100, Math.round((totalPointsEarned / totalPointsMax) * 100));

        // 5-Tier Executive Archetype Detection
        const ethicsScore = traitPercentiles['Clinical Integrity & Ethics'] || 0;
        const resilienceScore = traitPercentiles['Resilience & Grit Under Pressure'] || 0;
        const empathyScore = traitPercentiles['Empathy & Relationship Building'] || 0;
        const autonomyScore = traitPercentiles['Autonomy & Self-Motivation'] || 0;
        const scienceScore = traitPercentiles['Scientific Adaptability'] || 0;
        const collabScore = traitPercentiles['Collaborative Communication'] || 0;

        // Red Flag: Critical ethics failure or 3+ traits below 40%
        const traitsBelowThreshold = Object.values(traitPercentiles).filter(v => v < 40).length;
        const isRedFlag = ethicsScore < 45 || traitsBelowThreshold >= 3 || overallPercentile < 40;

        let archetype = '⚡ The Balanced Professional';
        let riskLevel = 'green';

        if (isRedFlag) {
            archetype = '🚨 Coaching Required — HR Review Recommended';
            riskLevel = 'red';
        } else if (overallPercentile >= 80 && scienceScore >= 78 && ethicsScore >= 78) {
            archetype = '🌟 The Scientific Strategist';
            riskLevel = 'green';
        } else if (overallPercentile >= 78 && empathyScore >= 78 && resilienceScore >= 72) {
            archetype = '🤝 The Empathetic Relationship Builder';
            riskLevel = 'green';
        } else if (overallPercentile >= 75 && autonomyScore >= 80) {
            archetype = '🚀 The Autonomous Pioneer';
            riskLevel = 'green';
        } else if (overallPercentile >= 68 && collabScore >= 72) {
            archetype = '🤜 The Collaborative Team Builder';
            riskLevel = 'green';
        } else if (overallPercentile >= 60) {
            archetype = '⚡ The Balanced Professional';
            riskLevel = overallPercentile >= 65 ? 'green' : 'amber';
        } else {
            archetype = '⚠️ Developing Candidate — Structured Onboarding Advised';
            riskLevel = 'amber';
        }

        // Generate automated coaching tips based on top and bottom traits
        const sortedTraits = Object.entries(traitPercentiles).sort((a, b) => b[1] - a[1]);
        const topTrait = sortedTraits[0];
        const bottomTrait = sortedTraits[sortedTraits.length - 1];

        const trainingMap = {
            'Clinical Integrity & Ethics': 'Medical Compliance & SOP Workshop (Week 1–2 of onboarding)',
            'Resilience & Grit Under Pressure': 'Field Immersion + Rejection Roleplay Program (Week 3–4)',
            'Empathy & Relationship Building': 'Hospital KOL Shadowing & Doctor Communication Program',
            'Autonomy & Self-Motivation': 'Goal Setting Framework + Daily KPI Planning Workshop',
            'Scientific Adaptability': 'ALOMOS GOLD Product Mastery Bootcamp + Clinical Detailing Certification',
            'Collaborative Communication': 'Cross-Team Reporting, CRM Training & Team Communication Workshop'
        };

        const coachingTips = [
            `Key Strength: Demonstrates exceptional performance in ${topTrait[0]} (${topTrait[1]}%). Assign to high-priority hospital accounts that leverage this competency.`,
            `Development Area: ${bottomTrait[0]} (${bottomTrait[1]}%). Recommended Training: ${trainingMap[bottomTrait[0]] || 'Structured 1-on-1 field mentorship during the 60-day probation period.'}`,
            `Overall Readiness: Executive Mindset Index of ${overallPercentile}%. ${overallPercentile >= 75 ? 'Highly recommended for autonomous hospital territory onboarding.' : overallPercentile >= 60 ? 'Recommended for supervised onboarding with structured weekly check-ins.' : 'Requires intensive onboarding program before independent field deployment.'}`
        ];

        const mindsetReport = {
            archetype,
            riskLevel,
            overallPercentile,
            traitPercentiles,
            coachingTips,
            isRedFlag,
            completedAt: new Date().toISOString()
        };

        await Applicant.updateOne({ _id: applicant._id }, {
            $set: {
                psychometricTestCompleted: true,
                psychometricScores: traitPercentiles,
                mindsetReport: mindsetReport
            }
        });

        // Save entry into ExamResult table so admin sees the Psychometric Report under Exam Reports tab
        try {
            await ExamResult.create({
                email: applicant.email,
                name: applicant.fullName || applicant.email,
                hq: applicant.hq || '',
                division: applicant.division || '',
                examDate: new Date().toISOString().split('T')[0],
                submittedAt: new Date(),
                testedProduct: '🧠 Phase 2: Candidate Mindset & Psychometric Assessment',
                totalQuestions: 30,
                autoScore: overallPercentile,
                manualScore: 0,
                totalScore: overallPercentile,
                status: 'graded',
                answers: {
                    ...(answers || {}),
                    mindsetReport: mindsetReport
                }
            });
        } catch (examErr) {
            console.error('Failed to create ExamResult entry for psychometric:', examErr);
        }

        res.json({ success: true, overallPercentile, archetype, mindsetReport });
    } catch (e) {
        console.error('Submit Psychometric Error:', e);
        res.status(500).json({ error: 'Failed to submit psychometric assessment' });
    }
});

// Admin Question Bank
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

router.delete('/questions/:id', async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/questions/:id', async (req, res) => {
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

router.post('/exam-questions', async (req, res) => {
    try {
        const { email, targetProduct } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne();
        
        let activeProduct = targetProduct || (company && company.activeExamProduct ? company.activeExamProduct : '');
        let mcqTime = company && company.examMcqTime ? company.examMcqTime : 15;
        let descTime = company && company.examDescriptiveTime ? company.examDescriptiveTime : 15;
        let mcqCount = company && company.examMcqCount ? company.examMcqCount : 10;

        if (applicant && applicant.pendingExams) {
            let pending = [];
            try { pending = typeof applicant.pendingExams === 'string' ? JSON.parse(applicant.pendingExams) : applicant.pendingExams; } catch(e){}
            const examConfig = pending.find(e => e.targetProduct === activeProduct);
            if (examConfig) {
                mcqTime = examConfig.mcqTime || mcqTime;
                descTime = examConfig.descTime || descTime;
                mcqCount = examConfig.mcqCount || mcqCount;
            }
        }
        
        const questions = await Question.find({ active: true });
        
        let allProductQs = questions.filter(q => {
            const qCat = (q.category || '').toLowerCase().trim();
            const qTarget = (q.targetProduct || '').toLowerCase().trim();
            const actProd = (activeProduct || '').toLowerCase().trim();

            // 1. Strict Isolation for Rapid Fire
            if (actProd === 'rapid fire' || actProd === 'rapid_fire') {
                return qCat === 'rapid fire' || qCat === 'rapid_fire' || qTarget === 'rapid fire' || qTarget === 'rapid_fire';
            }

            // 2. Strict Isolation for Psychometric
            if (actProd === 'psychometric') {
                return qCat === 'psychometric' || qTarget === 'psychometric';
            }

            // 3. Fallback for Product Tests (Ignore isolated screening tests)
            if (qCat === 'rapid fire' || qCat === 'rapid_fire' || qCat === 'psychometric') {
                return false; // Never mix screening tests into general product tests
            }

            // Only fetch Product questions for the activeProduct selected
            if (!activeProduct || activeProduct === 'General') {
                return qCat === 'emystein' || qTarget === 'emystein' || qCat === 'exam_product'; // Legacy fallback
            }

            return qCat === actProd || qTarget === actProd || qCat === 'exam_product';
        });
        
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
        const { email, answers, totalQuestions, testedProduct } = req.body;
        
        // Fetch missing fields dynamically from applicant record if frontend omitted them
        const applicantData = await Applicant.findOne({ email });
        const name = req.body.name || (applicantData ? applicantData.fullName : email);
        const hq = req.body.hq || (applicantData ? applicantData.hq : '');
        const division = req.body.division || (applicantData ? applicantData.division : '');
        const targetProduct = req.body.targetProduct || testedProduct || 'General';
        const examDate = req.body.examDate || new Date().toISOString().split('T')[0];
        
        let autoScore = 0;
        let mcqTotal = 0;
        let descTotal = 0;
        
        const questions = await Question.find({ active: true });
        const examQuestions = questions.filter(q => q.targetProduct === targetProduct);
        
        // Safely calculate total possible marks by type for this product
        if (examQuestions.length > 0) {
            examQuestions.forEach(q => {
                if (q.questionType === 'mcq') mcqTotal++;
                else descTotal++;
            });
        }
        
        for (const [qId, selectedIdxOrText] of Object.entries(answers || {})) {
            const q = questions.find(qu => qu._id === qId);
            if (q && q.questionType === 'mcq') {
                if (q.correctAnswerIndex === Number(selectedIdxOrText) || (q.options && q.options[q.correctAnswerIndex] === selectedIdxOrText)) {
                    autoScore++;
                }
            }
        }
        
        // Fallback if no questions found (e.g. legacy or deleted product)
        if (mcqTotal === 0 && descTotal === 0 && totalQuestions > 0) {
            mcqTotal = totalQuestions; // Assume all were MCQ for legacy point tracking
        }

        await ExamResult.create({
            email,
            name,
            hq,
            division,
            examDate,
            testedProduct: targetProduct || '',
            totalQuestions,
            mcqTotal,
            descTotal,
            autoScore,
            manualScore: 0,
            totalScore: autoScore,
            status: 'pending_review',
            answers
        });
        
        // Remove submitted exam from pendingExams
        const applicant = await Applicant.findOne({ email });
        if (applicant && applicant.pendingExams) {
            let pending = [];
            try { pending = typeof applicant.pendingExams === 'string' ? JSON.parse(applicant.pendingExams) : applicant.pendingExams; } catch(e){}
            const updatedPending = pending.filter(e => 
                !(e.targetProduct === targetProduct && e.examDate === examDate)
            );
            await Applicant.updateOne({ _id: applicant._id }, { $set: { pendingExams: updatedPending, rapidTestScore: autoScore } });
        }
        
        res.json({ success: true });
    } catch (e) {
        console.error('Submit Exam Error:', e);
        res.status(500).json({ error: 'Failed to submit exam' });
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


// --- APPLICANT DOCUMENT UPLOAD ---
// Save Progress (Draft)
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
        const fileUrl = await saveBase64ToFile(email, category, fileData);

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

        let updatedDocs = [];
        try {
            // Fresh read inside the lock to ensure we have the absolute latest array
            const currentApplicant = await Applicant.findOne({ email });
            let docs = currentApplicant.documents || [];
            
            // Convert to array if it's somehow a string (Sequelize JSON fallback)
            if (typeof docs === 'string') {
                try { docs = JSON.parse(docs); } catch (e) { docs = []; }
            }

            // All categories support multiple files
            docs.push(docMetadata);
            updatedDocs = docs;

            // Save back to DB atomically
            await Applicant.updateOne({ email }, { $set: { documents: docs } });
        } finally {
            // Release Mutex Lock
            delete documentUploadLocks[email];
        }

        console.log(`✅ [DOC] Local Upload: ${category} for ${email} saved to ${fileUrl}`);

        res.status(200).json({ 
            success: true, 
            message: `${category} uploaded successfully`,
            assetId: fileUrl,
            documents: updatedDocs
        });
    } catch (error) {
        console.error('❌ Document upload error:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

// --- ADMIN APIs ---

router.post('/api/admin-login', (req, res) => {
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

// FAST-TRACK EXISTING STAFF API
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

// BULK ADD EXISTING STAFF
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
            if (app && typeof app.mindsetReport === 'string') {
                try { app.mindsetReport = JSON.parse(app.mindsetReport); } catch(e) {}
            }
            if (app && typeof app.psychometricScores === 'string') {
                try { app.psychometricScores = JSON.parse(app.psychometricScores); } catch(e) {}
            }
            if (app && typeof app.formData === 'string') {
                try { app.formData = JSON.parse(app.formData); } catch(e) {}
            }
            return app;
        });

        res.status(200).json(optimizedApplicants);
    } catch (error) {
        console.error("List Fetch Error:", error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/accept-offer', async (req, res) => {
    try {
        const { email, actualJoiningDate } = req.body;
        const applicant = await Applicant.findOne({ email });
        const company = await Company.findOne() || { name: 'Company' };
        if (!applicant) return res.status(404).json({ error: 'Not found' });

        await Applicant.updateOne({ _id: applicant._id }, { $set: { offerAccepted: true, status: 'Joined (Probation)', offerAcceptedAt: new Date(), actualJoiningDate } });
        applicant.offerAccepted = true;
        applicant.status = 'Joined (Probation)';
        applicant.actualJoiningDate = actualJoiningDate;
        await syncActiveExamForApplicant(applicant);

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

        res.json({ success: true, pendingExams: applicant.pendingExams });
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
            const filePath = path.join(__dirname, '..', 'uploads', cleanFilename);
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
        res.json({ success: true, documents: applicant.documents });
    } catch (e) { res.status(500).json({ error: 'Delete failed' }); }
});

router.post('/resubmit-document', async (req, res) => {
    try {
        const { email, category, data, name } = req.body;
        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        // Save Base64 to disk
        const fileUrl = await saveBase64ToFile(email, category, data);

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
        let exams = await ExamResult.find({ email: req.params.email }).sort({ submittedAt: -1, _id: -1 });
        const applicant = await Applicant.findOne({ email: req.params.email });
        const dbQuestions = await Question.find();
        const allQuestions = [...dbQuestions, ...PSYCHOMETRIC_QUESTIONS_30];
        
        let formattedExams = exams.map(ex => {
            const exObj = ex.toObject ? ex.toObject() : { ...ex };
            if (!exObj.submittedAt || isNaN(new Date(exObj.submittedAt).getTime()) || new Date(exObj.submittedAt).getFullYear() <= 1970) {
                if (exObj.examDate) {
                    exObj.submittedAt = new Date(exObj.examDate);
                } else if (applicant && applicant.registeredAt) {
                    exObj.submittedAt = new Date(applicant.registeredAt);
                } else {
                    exObj.submittedAt = new Date();
                }
            }
            if ((exObj.testedProduct || '').toLowerCase().includes('psychometric') || (exObj.testedProduct || '').toLowerCase().includes('phase 2')) {
                exObj.testedProduct = '🧠 Phase 2: Candidate Mindset & Psychometric Assessment';
                exObj.totalQuestions = 30;
                if (exObj.answers && exObj.answers['Overall Readiness Index']) {
                    const p = parseInt(exObj.answers['Overall Readiness Index']);
                    if (!isNaN(p)) {
                        exObj.autoScore = p;
                        exObj.totalScore = p;
                    }
                }
            }
            return exObj;
        });

        // Ensure Rapid Fire Screening scorecard exists and is separate if completed
        const hasRapidResult = formattedExams.some(e => (e.testedProduct || '').toLowerCase().includes('rapid'));
        if (applicant && applicant.rapidTestCompleted && !hasRapidResult) {
            const rapidQs = dbQuestions.filter(q => q.active !== false && ['math', 'english', 'current_affairs', 'gk'].includes(q.category)).slice(0, 20);
            const mockAnswers = {};
            rapidQs.forEach((q, idx) => {
                if (idx < (applicant.rapidTestScore || 0)) {
                    mockAnswers[q._id] = q.correctAnswerIndex;
                } else {
                    mockAnswers[q._id] = (q.correctAnswerIndex + 1) % (q.options?.length || 4);
                }
            });

            const synthesizedRapid = {
                _id: 'rapid_card_' + (applicant._id || Date.now()),
                email: applicant.email,
                name: applicant.fullName || applicant.email,
                hq: applicant.hq || '',
                division: applicant.division || '',
                examDate: applicant.registeredAt ? new Date(applicant.registeredAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                submittedAt: applicant.registeredAt || new Date(),
                testedProduct: '🎯 Phase 1: Rapid Fire Screening Test',
                totalQuestions: 20,
                autoScore: applicant.rapidTestScore || 0,
                manualScore: 0,
                totalScore: applicant.rapidTestScore || 0,
                status: 'graded',
                answers: mockAnswers
            };
            formattedExams.push(synthesizedRapid);
        }

        res.json({ success: true, exams: formattedExams, questions: allQuestions });
    } catch (e) {
        console.error('Fetch My Scores Error:', e);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// Submit Onboarding
router.post('/submit-onboarding', async (req, res) => {
    try {
        const { email, formData } = req.body;

        const applicant = await Applicant.findOneAndUpdate(
            { email },
            {
                formData,
                status: 'submitted',
                canLogin: true,
                submittedAt: new Date(),
                hq: formData.hq,
                actualJoiningDate: formData.joiningDate, 
                dob: formData.dob, 
                address: formData.address || "",
                state: formData.state || "",
                salary: formData.salary || "",
                maritalStatus: formData.maritalStatus || "Unmarried",
                anniversaryDate: formData.maritalStatus === 'Married' ? `${formData.anniversaryDay}-${formData.anniversaryMonth}` : "",
                epfNumber: formData.epfNumber || "",
                uanNumber: formData.uanNumber || "",
                esiNumber: formData.esiNumber || ""
            },
            { new: true }
        );

        if (!applicant) {
            return res.status(404).json({ success: false, message: 'Applicant session not found. Please log in again.' });
        }

        const isUpdate = applicant.status && applicant.status !== 'draft' && applicant.status !== 'registered';
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">${isUpdate ? 'Applicant Profile Updated' : 'New Onboarding Submission'}</h2>
                <p><strong>Applicant:</strong> ${applicant.fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <hr>
                <p>${isUpdate ? 'The applicant has updated their personal details and documents.' : 'Detailed profile is now available in the Admin Portal for review and PDF download.'}</p>
            </div>
        `;

        sendEmail({
            to: process.env.EMAIL_USER,
            subject: `${isUpdate ? 'Profile Updated' : 'Form Submitted'}: ${applicant.fullName}`,
            html: emailHtml
        }).catch(e => console.error("Admin notification failed:", e.message));

        const applicantEmailHtml = isUpdate 
            ? `<h3>Hello, ${applicant.fullName}!</h3><p>Your details have been successfully updated at the official Emyris HR site. Our team will review the changes.</p>`
            : `<h3>Thank you, ${applicant.fullName}!</h3><p>Your onboarding documents have been submitted successfully. Our team will review them and get back to you.</p>`;

        sendEmail({
            to: email,
            subject: isUpdate ? 'Profile Update Confirmed - Emyris Biolifesciences' : 'Application Received - Emyris Biolifesciences',
            html: applicantEmailHtml
        }).catch(e => console.error("Applicant confirmation failed:", e.message));

        res.status(200).json({ success: true, message: 'Application submitted!' });
    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({ success: false, message: 'Submission failed: ' + error.message });
    }
});

module.exports = router;
