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
            if (q && q.correctAnswerIndex === Number(selectedIdx)) {
                score++;
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
            'Strictly state what the scientific trials support and offer to provide published monographs.',
            'Mention that while not officially indicated, some doctors observe anecdotal benefits.',
            'Emphasize the positive general nutrition profile without addressing the specific clinical gap.',
            'Agree enthusiastically to secure immediate hospital formulary approval.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_2', dimension: 'Clinical Integrity & Ethics',
        text: 'During a competitive hospital audit, a colleague suggests slightly exaggerating competitor side-effect rates to win the tender. What do you do?',
        options: [
            'Refuse firmly, relying exclusively on verified clinical head-to-head comparative data.',
            'Explain that misleading claims risk severe long-term credibility loss with doctors.',
            'Stay neutral and allow your colleague to present their argument alone.',
            'Go along with the suggestion if the competitor is known for aggressive marketing.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_3', dimension: 'Clinical Integrity & Ethics',
        text: 'You discover a minor reporting discrepancy in your monthly call summary log. What is your immediate action?',
        options: [
            'Proactively notify your reporting manager and rectify the log transparently.',
            'Correct the discrepancy moving forward without raising past flags.',
            'Wait until the quarterly review to see if the system auto-reconciles.',
            'Leave it as is since it does not affect commercial billing targets.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_4', dimension: 'Clinical Integrity & Ethics',
        text: 'A hospital stockist requests back-dated invoices for promotional sample distributions. How do you handle this?',
        options: [
            'Decline immediately and explain strict company compliance and audit policies.',
            'Consult your regional sales manager before making any commitments.',
            'Try to find a middle ground by adjusting future delivery dates.',
            'Accommodate the request to maintain a smooth distributor relationship.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_5', dimension: 'Clinical Integrity & Ethics',
        text: 'How do you view scientific compliance guidelines when under extreme end-of-month commercial target pressure?',
        options: [
            'Compliance and scientific accuracy are non-negotiable foundations of long-term medical trust.',
            'Important guidelines to follow, though speed is prioritized during month-end closing.',
            'Administrative hurdles that should balance flexibly against commercial urgency.',
            'Secondary checks once primary hospital order numbers are achieved.'
        ],
        weights: [5, 4, 2, 1]
    },

    // Dimension 2: Resilience & Grit Under Pressure
    {
        _id: 'psy_6', dimension: 'Resilience & Grit Under Pressure',
        text: 'After waiting 2.5 hours outside an ICU, the head surgeon abruptly cancels your meeting due to an emergency surgery. How do you react?',
        options: [
            'Empathize completely with the clinical emergency, leave a polite note, and reschedule promptly.',
            'Accept the situation professionally and utilize the time to meet resident doctors or hospital pharmacy staff.',
            'Feel frustrated about the lost time but attempt to catch the doctor in the corridor next day.',
            'Consider the hospital difficult to penetrate and shift immediate focus to easier clinics.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_7', dimension: 'Resilience & Grit Under Pressure',
        text: 'Your newly launched clinical formula faces unexpected initial skepticism from key opinion leaders (KOLs). What is your mindset?',
        options: [
            'View skepticism as an intellectual invitation to present deeper clinical evidence and mechanism studies.',
            'Seek senior manager intervention to co-detail and address specific clinical queries.',
            'Wait a few weeks for other doctors to adopt the formula before re-approaching skeptical KOLs.',
            'Focus promotional efforts entirely on doctors who readily accept new supplements without questioning.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_8', dimension: 'Resilience & Grit Under Pressure',
        text: 'You miss your quarterly territory milestone by 8% due to unforeseen hospital supply delays. How do you process this?',
        options: [
            'Conduct a root-cause analysis, optimize supply chain coordination, and create a robust recovery plan.',
            'Review where calls dropped and intensify daily detailing frequency in the new quarter.',
            'Accept that external supply delays are beyond personal control and reset expectations.',
            'Feel discouraged and wait for management to assign revised lower targets.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_9', dimension: 'Resilience & Grit Under Pressure',
        text: 'During a live clinical presentation, a doctor challenges the statistical significance of your clinical trial chart in front of peers. How do you respond?',
        options: [
            'Maintain absolute poise, acknowledge the valid perspective, and clearly explain the p-value and study parameters.',
            'Politely note the observation and offer to email the complete medical affairs dossier after the session.',
            'Become defensive and reassert that the brand is approved by leading national specialists.',
            'Deflect the question quickly to move on to the remaining presentation slides.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_10', dimension: 'Resilience & Grit Under Pressure',
        text: 'When faced with back-to-back challenging days of high traffic and difficult doctor availability, what sustains your momentum?',
        options: [
            'Internal drive, discipline, and commitment to improving patient clinical outcomes through detailing.',
            'Focusing on daily step-by-step progress and upcoming weekly territory milestones.',
            'Taking frequent breaks and waiting for the schedule to ease up.',
            'Relying primarily on external sales incentive bonuses to push through exhausting days.'
        ],
        weights: [5, 4, 2, 1]
    },

    // Dimension 3: Empathy & Relationship Building (EQ)
    {
        _id: 'psy_11', dimension: 'Empathy & Relationship Building',
        text: 'A pediatric consultant expresses deep frustration about gastrointestinal side effects observed with standard protein formulas. How do you approach the pitch?',
        options: [
            'Actively listen to their specific patient struggles first before explaining ALOMOS GOLD’s DigeZyme and probiotic tolerability profile.',
            'Immediately present the product brochure highlighting the 5-in-1 GI friendly formula.',
            'Mention that GI issues are common across all protein supplements in the industry.',
            'Emphasize only the taste and price benefits to change the topic from GI distress.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_12', dimension: 'Empathy & Relationship Building',
        text: 'You notice that a key hospital pharmacist looks unusually stressed and overwhelmed during your afternoon visit. What do you do?',
        options: [
            'Offer brief cordial support, ask how you can help streamline stock checks, and keep the interaction efficient.',
            'Ask quickly if stock is needed and leave promotional flyers without taking up their time.',
            'Proceed with your standard 10-minute product presentation regardless of their busy state.',
            'Postpone the visit entirely without inquiring if urgent inventory replenishment is required.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_13', dimension: 'Empathy & Relationship Building',
        text: 'A doctor mentions they care more about post-surgical recovery speed than just daily protein intake. How do you adapt?',
        options: [
            'Pivot the conversation directly to clinical muscle synthesis, wound healing, and recovery kinetics.',
            'Acknowledge recovery speed but continue detailing all standard protein nutrition slides sequentially.',
            'State that protein intake naturally solves all recovery issues over time.',
            'Suggest they consult the hospital dietician for specific surgical recovery protocols.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_14', dimension: 'Empathy & Relationship Building',
        text: 'How do you build trust with a senior institutional buyer who has been loyal to a legacy competitor for 15 years?',
        options: [
            'Respect their clinical experience, seek their expert feedback on nutritional gaps, and build rapport gradually.',
            'Offer aggressive comparative discounts and free trial packages to force a switch.',
            'Argue that legacy formulations are outdated and inferior to modern clinical nutrition.',
            'Avoid spending significant time on loyalist buyers until they express dissatisfaction.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_15', dimension: 'Empathy & Relationship Building',
        text: 'When a patient caregiver asks you a product dosage question in the hospital corridor, how do you handle it?',
        options: [
            'Provide clear, empathetic general information while strictly advising them to verify dosing with their treating doctor.',
            'Give exact clinical dosage recommendations directly based on the product insert.',
            'Politely state that you only speak with medical professionals and walk away.',
            'Hand them a promotional leaflet and ask them to read the back panel.'
        ],
        weights: [5, 4, 2, 1]
    },

    // Dimension 4: Autonomy & Self-Motivation (Drive)
    {
        _id: 'psy_16', dimension: 'Autonomy & Self-Motivation',
        text: 'Your reporting manager is traveling and unreachable during an unexpected hospital formulary submission deadline. What steps do you take?',
        options: [
            'Take complete initiative, assemble all verified statutory and clinical documents accurately, and submit on time.',
            'Prepare the documentation package and inform HR or secondary managers for interim sign-off.',
            'Wait until your reporting manager returns to avoid taking sole responsibility.',
            'Request the hospital procurement officer for an extension until your manager is back.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_17', dimension: 'Autonomy & Self-Motivation',
        text: 'How do you structure your daily hospital detailing schedule when working independently in the field?',
        options: [
            'Plan routes systematically based on doctor OPD timings, priority tiering, and clinical high-impact targets.',
            'Follow a standard geographical loop from morning to evening across familiar hospitals.',
            'Decide daily visits spontaneously each morning depending on traffic and weather.',
            'Rely on hospital calls or distributor requests to dictate where you visit each day.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_18', dimension: 'Autonomy & Self-Motivation',
        text: 'You discover a new private nursing home that is not currently listed in your territory coverage master. What do you do?',
        options: [
            'Autonomously conduct an initial survey, meet the resident medical officer, and add it to your growth pipeline.',
            'Note down the address and ask your manager during the next review if you should visit.',
            'Ignore it unless it is officially assigned during territory redistribution.',
            'Check if a competitor visits there before deciding whether it is worth exploring.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_19', dimension: 'Autonomy & Self-Motivation',
        text: 'When learning about a new clinical indication for ALOMOS GOLD, how do you upgrade your detailing mastery?',
        options: [
            'Self-study clinical papers, practice pitch delivery using Voice Studio AI, and refine terminology proactively.',
            'Attend official company training webinars and review the provided slide decks carefully.',
            'Wait for the sales manager to conduct a role-play session during the monthly meeting.',
            'Use the basic tagline summary until doctors start asking specific technical questions.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_20', dimension: 'Autonomy & Self-Motivation',
        text: 'What best describes your personal attitude toward setting professional career benchmarks?',
        options: [
            'I constantly challenge myself to exceed standard clinical mastery and territory leadership goals.',
            'I aim to consistently meet all official company targets and maintain reliable performance.',
            'I focus on steady work-life balance while completing assigned daily duties.',
            'I prefer when supervisors define clear benchmarks so I know what minimums to hit.'
        ],
        weights: [5, 4, 2, 1]
    },

    // Dimension 5: Scientific Adaptability (Learning Agility)
    {
        _id: 'psy_21', dimension: 'Scientific Adaptability',
        text: 'You are asked to detail a complex 5-in-1 clinical nutrition formula with only 24 hours of preparation time. How do you approach it?',
        options: [
            'Deconstruct the 5 core pillars (Protein, DigeZyme, Probiotics, Curcumin, Micronutrients) and master the primary clinical hook immediately.',
            'Focus on memorizing the top 3 product benefits and read up on the rest during transit.',
            'Request a 48-hour extension from management to ensure complete memorization.',
            'Detail only the general brand name until you feel comfortable with complex pharmacology.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_22', dimension: 'Scientific Adaptability',
        text: 'A specialist doctor asks how ALOMOS GOLD’s Curcumin absorption differs from standard dietary turmeric extract. How do you respond?',
        options: [
            'Explain the specialized bio-enhanced formulation and anti-inflammatory kinetics clearly and accurately.',
            'State that it is formulated specifically for maximum clinical absorption and high bioavailability.',
            'Admit you will confirm the precise pharmacological mechanism with medical affairs and follow up promptly.',
            'Change the subject back to the high protein content and delicious flavor profile.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_23', dimension: 'Scientific Adaptability',
        text: 'When digital detailing iPads and AI voice scoring tools are introduced to replace paper brochures, what is your reaction?',
        options: [
            'Embrace the digital tools enthusiastically, practicing rapidly to elevate doctor engagement quality.',
            'Adopt the technology as required by company SOPs after attending orientation sessions.',
            'Use digital tools when required but prefer relying on traditional physical flipcharts whenever possible.',
            'Resist the digital transition, feeling that technology complicates personal doctor interactions.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_24', dimension: 'Scientific Adaptability',
        text: 'How do you handle complex questions regarding geriatric sarcopenia during a clinical presentation?',
        options: [
            'Connect muscle protein synthesis directly to clinical prevention of age-related muscle wasting with confidence.',
            'Highlight that ALOMOS GOLD is excellent for senior citizens and joint mobility support.',
            'Refer the doctor to the geriatric section of the clinical monograph.',
            'Admit that geriatric care is complex and focus the pitch on general adult wellness.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_25', dimension: 'Scientific Adaptability',
        text: 'When reading dense clinical trial journals and pharmacological papers, what is your primary focus?',
        options: [
            'Extracting clinical evidence, patient outcome metrics, and practical detailing hooks for doctors.',
            'Understanding the summary conclusion and key statistically significant p-values.',
            'Scanning for brand names and dosage guidelines suitable for promotional folders.',
            'Finding simple bullet points that can be quickly recited without deep reading.'
        ],
        weights: [5, 4, 2, 1]
    },

    // Dimension 6: Collaborative Communication (Team Play)
    {
        _id: 'psy_26', dimension: 'Collaborative Communication',
        text: 'A colleague on a shared hospital territory disagrees with your product positioning strategy during a joint preparation meeting. How do you resolve this?',
        options: [
            'Engage in open, objective dialogue, evaluate both clinical angles, and align on a unified high-impact strategy.',
            'Suggest splitting the hospital doctors so each person can detail their preferred way.',
            'Defer completely to your colleague’s strategy to avoid any friction.',
            'Insist on your approach since you have done more recent doctor visits.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_27', dimension: 'Collaborative Communication',
        text: 'During a regional sales conference, HR provides constructive feedback on improving your CRM reporting frequency. How do you receive it?',
        options: [
            'Welcome the feedback with gratitude, recognize its organizational value, and optimize your reporting routine immediately.',
            'Accept the feedback calmly and make sure weekly reports are submitted on schedule.',
            'Explain that heavy fieldwork leaves limited time for administrative CRM entries.',
            'Feel criticized and believe that clinical sales results should outweigh reporting formalities.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_28', dimension: 'Collaborative Communication',
        text: 'A new junior team member joins your division and struggles to understand clinical detailing scripts. What do you do?',
        options: [
            'Offer mentorship, conduct practice mock calls, and share successful detailing techniques to accelerate their growth.',
            'Answer their specific questions whenever they reach out to you for guidance.',
            'Encourage them to re-read the training manual and watch official video recordings.',
            'Focus strictly on your own territory goals and let HR handle all onboarding training.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_29', dimension: 'Collaborative Communication',
        text: 'How do you coordinate with hospital distributors and supply chain teams when facing sudden demand spikes?',
        options: [
            'Maintain transparent, proactive daily communication, forecasting hospital needs clearly to prevent stock-outs.',
            'Inform the supply team once an order is placed and track expected delivery dates.',
            'Expect the distributor to automatically manage buffer inventory without personal follow-up.',
            'Blame the logistics department if hospital supply runs short during peak demand.'
        ],
        weights: [5, 4, 2, 1]
    },
    {
        _id: 'psy_30', dimension: 'Collaborative Communication',
        text: 'What is your core philosophy on achieving commercial success within Emyris Biolifesciences?',
        options: [
            'True excellence is achieved through clinical integrity, collaborative teamwork, and continuous scientific learning.',
            'Success comes from disciplined daily effort, hitting personal numbers, and following company guidelines.',
            'Individual drive and competitive ambition are the primary drivers of field performance.',
            'Maintaining good relationships with hospital staff and managers ensures steady career progress.'
        ],
        weights: [5, 4, 2, 1]
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

        PSYCHOMETRIC_QUESTIONS_30.forEach(q => {
            const selectedIdx = answers && answers[q._id] !== undefined ? Number(answers[q._id]) : -1;
            const pts = (selectedIdx >= 0 && selectedIdx < q.weights.length) ? q.weights[selectedIdx] : 1;
            if (dimensionScores[q.dimension]) {
                dimensionScores[q.dimension].earned += pts;
            }
            totalPointsEarned += pts;
            totalPointsMax += 5; // max weight is 5
        });

        // Convert to percentages
        const traitPercentiles = {};
        for (const [dim, data] of Object.entries(dimensionScores)) {
            traitPercentiles[dim] = Math.min(100, Math.round((data.earned / data.max) * 100));
        }

        const overallPercentile = Math.min(100, Math.round((totalPointsEarned / totalPointsMax) * 100));

        // Determine Executive Archetype
        let archetype = "⚡ The Balanced Professional";
        if (overallPercentile >= 85 && traitPercentiles['Scientific Adaptability'] >= 85 && traitPercentiles['Clinical Integrity & Ethics'] >= 85) {
            archetype = "🌟 The Scientific Strategist";
        } else if (overallPercentile >= 85 && traitPercentiles['Empathy & Relationship Building'] >= 85 && traitPercentiles['Resilience & Grit Under Pressure'] >= 85) {
            archetype = "🤝 The Empathetic Relationship Builder";
        } else if (overallPercentile >= 85 && traitPercentiles['Autonomy & Self-Motivation'] >= 85) {
            archetype = "🚀 The Autonomous Pioneer";
        } else if (overallPercentile < 65 || Object.values(traitPercentiles).some(val => val < 50)) {
            archetype = "⚠️ Coaching Required Profile";
        }

        // Generate automated coaching tips based on top and bottom traits
        const sortedTraits = Object.entries(traitPercentiles).sort((a, b) => b[1] - a[1]);
        const topTrait = sortedTraits[0];
        const bottomTrait = sortedTraits[sortedTraits.length - 1];

        const coachingTips = [
            `Key Strength: Exhibits exceptional mastery in ${topTrait[0]} (${topTrait[1]}%). Assign to high-priority hospital accounts that leverage this attribute.`,
            `Development Area: ${bottomTrait[0]} (${bottomTrait[1]}%). Provide structured 1-on-1 mentorship and field role-play during the initial 60-day probation period.`,
            `Overall Readiness: Achieved an executive mindset rating of ${overallPercentile}%. ${overallPercentile >= 75 ? 'Highly recommended for autonomous hospital territory onboarding.' : 'Recommended for structured onboarding with frequent supervisory check-ins.'}`
        ];

        const mindsetReport = {
            archetype,
            overallPercentile,
            traitPercentiles,
            coachingTips,
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
                    'Overall Readiness Index': `${overallPercentile}%`,
                    'Executive Archetype Badge': archetype,
                    'Clinical Integrity & Ethics': `${traitPercentiles['Clinical Integrity & Ethics'] || 0}%`,
                    'Resilience & Grit Under Pressure': `${traitPercentiles['Resilience & Grit Under Pressure'] || 0}%`,
                    'Empathy & Relationship Building': `${traitPercentiles['Empathy & Relationship Building'] || 0}%`,
                    'Autonomy & Self-Motivation': `${traitPercentiles['Autonomy & Self-Motivation'] || 0}%`,
                    'Scientific Adaptability': `${traitPercentiles['Scientific Adaptability'] || 0}%`,
                    'Collaborative Communication': `${traitPercentiles['Collaborative Communication'] || 0}%`,
                    'Coaching & Mentorship Tips': coachingTips ? coachingTips.join(' | ') : ''
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
        const { email, name, hq, division, examDate, targetProduct, answers, totalQuestions } = req.body;
        
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
            testedProduct: targetProduct || '',
            totalQuestions,
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

            // The isMulti restriction has been removed. 
            // All categories now support multiple files (e.g. Front & Back uploads for Aadhar/PAN).
            // Append the new document
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
