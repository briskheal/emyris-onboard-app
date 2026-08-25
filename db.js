const { Sequelize, Op } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'sqlite:./onboarding_fallback.sqlite';
const isRemoteSslDb = dbUrl.includes('sslmode=require') || dbUrl.includes('.neon.tech') || dbUrl.includes('.amazonaws.com') || dbUrl.includes('.render.com');

const sequelize = new Sequelize(dbUrl, {
    dialect: dbUrl.startsWith('sqlite') ? 'sqlite' : 'postgres',
    logging: false,
    dialectOptions: isRemoteSslDb ? {
        ssl: { rejectUnauthorized: false }
    } : {},
    pool: {
        max: 50, // Expanded for high concurrency (/xl module)
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Import schemas and adapter
const { MongooseAdapter } = require('./models/adapter');
const initModels = require('./models/pgModels');
const initXlModels = require('./models/xlModels');

const {
    XlDoctor,
    XlChemist,
    XlStockist,
    XlState,
    XlHQ,
    XlCity,
    XlRoute, XlDivision, XlDesignation, XlUser, XlAdmin,
    XlTourProgram,
    XlDCR,
    XlAttendance,
    XlLeave,
    XlExpense,
    XlBacklogRequest, XlProductCategory, XlProductType, XlProduct, XlProductSupplier, XlInventory,
    XlCallPlan
} = initXlModels(sequelize);

const {
    OnboardCompany,
    OnboardAsset,
    OnboardApplicant,
    OnboardDivision,
    OnboardHQ,
    OnboardTemplateHistory,
    OnboardQuestion,
    OnboardExamResult,
    OnboardPayslip,
    OnboardLeaveType,
    OnboardLeaveBalance,
    OnboardLeaveRequest,
    OnboardLoanType,
    OnboardAssignedLoan,
    OnboardAssignedAdvance
} = initModels(sequelize);

// Initialize Adapters
const Company = new MongooseAdapter(OnboardCompany);
const Asset = new MongooseAdapter(OnboardAsset);
const Applicant = new MongooseAdapter(OnboardApplicant);
const Division = new MongooseAdapter(OnboardDivision);
const HQ = new MongooseAdapter(OnboardHQ);
const TemplateHistory = new MongooseAdapter(OnboardTemplateHistory);
const Question = new MongooseAdapter(OnboardQuestion);
const ExamResult = new MongooseAdapter(OnboardExamResult);
const Payslip = new MongooseAdapter(OnboardPayslip);
const LeaveType = new MongooseAdapter(OnboardLeaveType);
const LeaveBalance = new MongooseAdapter(OnboardLeaveBalance);
const LeaveRequest = new MongooseAdapter(OnboardLeaveRequest);
const LoanType = new MongooseAdapter(OnboardLoanType);
const AssignedLoan = new MongooseAdapter(OnboardAssignedLoan);
const AssignedAdvance = new MongooseAdapter(OnboardAssignedAdvance);

// Database Sync and Seed Function
async function syncDatabase() {
    try {
        // Run standard sync first so any new tables (like onboard_exam_results) are guaranteed to be created
        await sequelize.sync();
        try {
            await sequelize.sync({ alter: true });
        } catch (alterErr) {
            console.warn('⚠️ Sync alter warning (falling back to standard sync):', alterErr.message);
        }
        
        // Safely ensure new columns exist in SQLite or Postgres if alter:true skipped
        const isPostgres = sequelize.getDialect() === 'postgres';
        const queries = isPostgres ? [
            'ALTER TABLE onboard_applicants ADD COLUMN IF NOT EXISTS "psychometricTestCompleted" BOOLEAN DEFAULT false;',
            'ALTER TABLE onboard_applicants ADD COLUMN IF NOT EXISTS "psychometricScores" TEXT;',
            'ALTER TABLE onboard_applicants ADD COLUMN IF NOT EXISTS "mindsetReport" TEXT;'
        ] : [
            'ALTER TABLE onboard_applicants ADD COLUMN psychometricTestCompleted BOOLEAN DEFAULT 0;',
            'ALTER TABLE onboard_applicants ADD COLUMN psychometricScores TEXT;',
            'ALTER TABLE onboard_applicants ADD COLUMN mindsetReport TEXT;'
        ];
        for (const q of queries) {
            try { await sequelize.query(q); } catch (e) {}
        }
        console.log('✅ Synchronized onboard_* tables in database.');

        // ---- AUTO HEAL LEGACY 20% PSYCHOMETRIC SCORES ----
        try {
            const apps = await Applicant.find();
            let healedCount = 0;
            for (const app of apps) {
                let report = app.mindsetReport;
                if (typeof report === 'string') {
                    try { report = JSON.parse(report); } catch(e) {}
                }
                if (report && (report.overallPercentile === 20 || report.overallPercentile === 0 || report.archetype.includes('NOT APPEARED'))) {
                    await Applicant.updateOne({ _id: app._id }, { 
                        $set: { psychometricTestCompleted: false },
                        $unset: { psychometricScores: 1, mindsetReport: 1 }
                    });
                    healedCount++;
                }
            }
            if (healedCount > 0) console.log(`🔧 Auto-healed ${healedCount} legacy 20% psychometric records.`);
        } catch (healErr) { console.error('Failed to auto-heal records:', healErr.message); }
        // ----------------------------------------------------

        // Seed Default Company only if missing. Never overwrite existing targetProductsList if admin deleted/edited items.
        let c = await Company.findOne();
        let defaultProducts = ['General', 'Emystein', 'ALOMOS HP ADVANCED', 'Alomos DM', 'ALOMOS GOLD', 'Alomos MAMA', 'GLOWVIT-60K', 'GulpCDZ'];
        // Also extract any distinct product/category labels from seedQuestions
        if (typeof seedQuestions !== 'undefined' && Array.isArray(seedQuestions)) {
            seedQuestions.forEach(sq => {
                if (sq.targetProduct && sq.targetProduct !== 'General' && !defaultProducts.includes(sq.targetProduct)) {
                    defaultProducts.push(sq.targetProduct);
                }
                if (sq.category && !['math', 'english', 'current_affairs', 'gk', 'exam_product', 'exam_current_affairs', 'general'].includes(sq.category.toLowerCase())) {
                    const formattedCat = sq.category.toUpperCase().includes('GLOWVIT') ? 'GLOWVIT-60K' : (sq.category.toUpperCase().includes('ALOMOS GOLD') ? 'ALOMOS GOLD' : sq.category);
                    if (!defaultProducts.includes(formattedCat) && !defaultProducts.some(p => p.toLowerCase() === sq.category.toLowerCase())) {
                        defaultProducts.push(formattedCat);
                    }
                }
            });
        }

        if (!c) {
            c = await Company.create({
                name: 'Emyris Biolifesciences',
                website: 'www.emyrisbio.com',
                targetProductsList: defaultProducts
            });
            console.log('🌱 Seeded default Company profile with dynamic targetProductsList.');
        } else {
            console.log('ℹ️ Company profile already exists. Updating and deduplicating targetProductsList to match uploaded Questionnaires exactly.');
            let existingList = Array.isArray(c.targetProductsList) ? c.targetProductsList : [];
            // Remove 'Alomos GOLD' or mismatched casing and keep only 'ALOMOS GOLD' against which questionnaires are uploaded
            existingList = existingList.filter(p => p !== 'Alomos GOLD' && (p.toLowerCase() !== 'alomos gold' || p === 'ALOMOS GOLD'));
            // Ensure all required defaultProducts are included
            defaultProducts.forEach(prod => {
                if (!existingList.some(p => p.toLowerCase() === prod.toLowerCase())) {
                    existingList.push(prod);
                } else if (prod === 'ALOMOS GOLD' && !existingList.includes('ALOMOS GOLD')) {
                    existingList = existingList.map(p => p.toLowerCase() === 'alomos gold' ? 'ALOMOS GOLD' : p);
                }
            });
            const cleanList = [...new Set(existingList)];
            await Company.updateOne({ _id: c._id }, { $set: { targetProductsList: cleanList } });
            console.log('🌱 Synchronized targetProductsList clean summary:', cleanList);
        }

        // Migrate any hyphenated 'alomos-gold' or mixed-case Alomos GOLD in Question Bank to exact 'ALOMOS GOLD'
        await Question.updateMany({ category: { $in: ['alomos-gold', 'Alomos GOLD', 'alomos gold'] } }, { $set: { category: 'ALOMOS GOLD', targetProduct: 'ALOMOS GOLD' } });
        await Question.updateMany({ targetProduct: { $in: ['alomos-gold', 'Alomos GOLD', 'alomos gold'] } }, { $set: { category: 'ALOMOS GOLD', targetProduct: 'ALOMOS GOLD' } });

        // Seed Rapid Test Questions
        try {
            const seedQuestions = [
                // General Emystein Background Questions
                { category: 'general', text: 'Which component constitutes the active ingredient in Emystein?', options: ['Amoxicillin', 'Colistimethate Sodium', 'Ciprofloxacin', 'Azithromycin'], correctAnswerIndex: 1 },
                { category: 'general', text: 'In which scenario is Emystein typically indicated?', options: ['Viral upper respiratory infections', 'Mild skin abrasions', 'Severe Gram-negative infections', 'Fungal dermatitis'], correctAnswerIndex: 2 },
                { category: 'general', text: 'Emystein is primarily effective against which type of bacteria?', options: ['Gram-positive', 'Gram-negative', 'Atypical', 'Anaerobic'], correctAnswerIndex: 1 },
                { category: 'general', text: 'What is the standard administration route for Emystein 3miu in systemic infections?', options: ['Oral tablet', 'Intravenous injection', 'Topical ointment', 'Inhalation only'], correctAnswerIndex: 1 },
                { category: 'general', text: 'Which of the following pathogens is Emystein particularly noted for combating?', options: ['Streptococcus pyogenes', 'Pseudomonas aeruginosa', 'Candida albicans', 'Staphylococcus epidermidis'], correctAnswerIndex: 1 },
                { category: 'general', text: 'In the context of antimicrobial resistance, why is Emystein considered crucial?', options: ['It is a broad-spectrum antiviral.', 'It is often used as a last-resort antibiotic for multidrug-resistant infections.', 'It enhances the immune system directly.', 'It is the only antibiotic available over-the-counter.'], correctAnswerIndex: 1 },
                { category: 'general', text: 'What is the unit of measurement used for dosing Emystein 3miu?', options: ['Milligrams (mg)', 'Grams (g)', 'Million International Units (MIU)', 'Micrograms (mcg)'], correctAnswerIndex: 2 },
                { category: 'general', text: 'Which organ system requires careful monitoring when a patient is on Emystein therapy?', options: ['Cardiovascular system', 'Renal system (Kidneys)', 'Gastrointestinal tract', 'Central nervous system'], correctAnswerIndex: 1 },
                { category: 'general', text: 'Emystein belongs to which class of antimicrobial agents?', options: ['Penicillins', 'Cephalosporins', 'Polymyxins', 'Macrolides'], correctAnswerIndex: 2 },
                { category: 'general', text: 'Which patient population frequently receives Emystein in an intensive care setting?', options: ['Patients with uncomplicated UTIs', 'Patients with cystic fibrosis and ventilator-associated pneumonia', 'Outpatients with strep throat', 'Patients with seasonal allergies'], correctAnswerIndex: 1 },
                
                // Emystein Descriptive General
                { category: 'general', text: 'What are the main indications of Emystein?', questionType: 'descriptive', inputFields: [] },
                { category: 'general', text: 'Describe the mechanism of action of colistimethate sodium.', questionType: 'descriptive', inputFields: [] },
                
                // Emystein Specific Questions
                { category: 'emystein', text: 'Who will be the focused doctor for Emystein 3miu?', questionType: 'mcq', options: ['GP', 'Dentist', 'Intensivist', 'Gynaecologist'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'What is the active molecule in Emystein?', questionType: 'mcq', options: ['Amoxicillin', 'Colistimethate Sodium', 'Ceftriaxone', 'Meropenem'], correctAnswerIndex: 1 },
                { category: 'emystein', text: 'What is the primary indication for Emystein 3miu?', questionType: 'mcq', options: ['Viral Infections', 'Fungal Infections', 'Multi-drug resistant Gram-negative infections', 'Parasitic Infections'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'How is Emystein 3miu typically administered?', questionType: 'mcq', options: ['Oral tablet', 'Intravenous or Intramuscular injection', 'Topical cream', 'Subcutaneous injection'], correctAnswerIndex: 1 },
                { category: 'emystein', text: 'Which of the following is a known potential side effect of colistimethate sodium?', questionType: 'mcq', options: ['Nephrotoxicity', 'Hepatotoxicity', 'Cardiotoxicity', 'Retinopathy'], correctAnswerIndex: 0 },
                { category: 'emystein', text: 'In which setting is Emystein most commonly prescribed?', questionType: 'mcq', options: ['Outpatient Clinics', 'Intensive Care Units (ICUs)', 'Dental Clinics', 'Dermatology Clinics'], correctAnswerIndex: 1 },
                { category: 'emystein', text: 'Emystein belongs to which class of antibiotics?', questionType: 'mcq', options: ['Penicillins', 'Cephalosporins', 'Polymyxins', 'Macrolides'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'Which pathogen is Emystein particularly effective against?', questionType: 'mcq', options: ['Staphylococcus aureus', 'Streptococcus pneumoniae', 'Pseudomonas aeruginosa', 'Candida albicans'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'What is the standard dosage unit for Emystein?', questionType: 'mcq', options: ['Milligrams (mg)', 'Grams (g)', 'Million International Units (MIU)', 'Micrograms (mcg)'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'When should the dosage of Emystein be adjusted?', questionType: 'mcq', options: ['In patients with renal impairment', 'In patients with hepatic impairment', 'In patients with hypertension', 'In pregnant patients only'], correctAnswerIndex: 0 },

                { category: 'emystein', text: 'What is the MRP of the product?', questionType: 'descriptive', inputFields: [] },
                { category: 'emystein', text: 'Write 4 competitors brand names.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3', 'Space 4'] },
                { category: 'emystein', text: 'Write 3 major consuming hospitals in your HQ.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3'] },
                { category: 'emystein', text: 'Write maximum used by 3 Doctors name.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3'] },
                { category: 'emystein', text: 'What was last month Secondary units?', questionType: 'descriptive', inputFields: [] },
                { category: 'emystein', text: 'What was last month Primary units?', questionType: 'descriptive', inputFields: [] },
                { category: 'emystein', text: 'How to improve sales? Your suggestions.', questionType: 'descriptive', inputFields: [] },

                // GLOWVIT-60K Specific Questions (15 MCQ & 3 Descriptive)
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'What is the active ingredient and strength of GLOWVIT-60K?', questionType: 'mcq', options: ['Vitamin B12 Oral Solution 1,500 mcg', 'Vitamin D3 Oral Solution 60,000 IU', 'Calcium Carbonate Oral Suspension 500 mg', 'Vitamin C Oral Solution 1,000 mg'], correctAnswerIndex: 1 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'What advanced formulation technology is used in GLOWVIT-60K to ensure superior bioavailability?', questionType: 'mcq', options: ['Extended-release micro-pellets', 'Advanced Vitamin D3 Nano Formula (Nano-sized particles)', 'Enteric-coated tablet matrix', 'Effervescent powder granules'], correctAnswerIndex: 1 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'According to clinical specifications, what is the bioavailability and absorption rate of GLOWVIT-60K nano shot compared to conventional forms?', questionType: 'mcq', options: ['50% bioavailability with 2x absorption rate', '75% bioavailability with standard absorption', '95%+ bioavailability with 3x faster absorption', '60% bioavailability with slow sustained release'], correctAnswerIndex: 2 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'In what ready-to-use dosage form and volume is GLOWVIT-60K presented?', questionType: 'mcq', options: ['10 ml multi-dose syrup bottle', 'Single 5ml ready-to-use oral solution shot', '2 ml intramuscular injection vial', '15 ml drop bottle for infants'], correctAnswerIndex: 1 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'Beyond bone mineralization, what key musculoskeletal benefit does GLOWVIT-60K provide?', questionType: 'mcq', options: ['Reduces synovial fluid viscosity', 'Enhances skeletal muscle strength and reduces muscle weakness', 'Acts as a direct neuromuscular blocker', 'Stimulates uric acid excretion from joints'], correctAnswerIndex: 1 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'GLOWVIT-60K significantly improves the intestinal absorption of which two essential minerals?', questionType: 'mcq', options: ['Sodium and Potassium', 'Iron and Zinc', 'Calcium and Phosphorus', 'Magnesium and Copper'], correctAnswerIndex: 2 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'How does GLOWVIT-60K contribute to the management of diabetes?', questionType: 'mcq', options: ['By directly inhibiting intestinal glucose absorption', 'By enhancing insulin sensitivity, supporting pancreatic beta-cell function, & reducing inflammation', 'By acting as a synthetic insulin analogue', 'By accelerating renal excretion of glucose'], correctAnswerIndex: 1 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'What potential cardiovascular benefit is associated with the Vitamin D3 action in GLOWVIT-60K?', questionType: 'mcq', options: ['Reduces platelet aggregation and thrombogenesis, contributing potential role in treatment of CVDs', 'Directly lowers heart rate like a beta-blocker', 'Increases peripheral vascular resistance', 'Acts as a direct loop diuretic'], correctAnswerIndex: 0 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'Why is GLOWVIT-60K specifically indicated for elderly individuals and post-menopausal women?', questionType: 'mcq', options: ['To treat acute respiratory distress', 'To promote bone density and significantly reduce fracture risk', 'To prevent age-related macular degeneration', 'To increase gastric acid secretion'], correctAnswerIndex: 1 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'What clinical role does GLOWVIT-60K play during pregnancy and lactation?', questionType: 'mcq', options: ['Improves maternal and foetal bone health and supports stable D3 levels', 'Acts as an anti-emetic for morning sickness', 'Prevents gestational iron-deficiency anemia', 'Accelerates labor contractions'], correctAnswerIndex: 0 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'Which of the following conditions is NOT a primary indication for GLOWVIT-60K?', questionType: 'mcq', options: ['Osteoporosis, Osteopenia, and Osteomalacia / Rickets', 'Hypocalcemia and Hypoparathyroidism', 'Chronic Kidney Disease (CKD) associated bone disease', 'Acute Bacterial Meningitis'], correctAnswerIndex: 3 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'What is the recommended dosage regimen of GLOWVIT-60K for standard Vitamin D deficiency?', questionType: 'mcq', options: ['60,000 IU once daily for 30 days', '60,000 IU once weekly for 6–8 weeks', '60,000 IU twice weekly for 2 weeks', '60,000 IU once monthly for 1 year'], correctAnswerIndex: 1 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'For severe Vitamin D deficiency, how long is the weekly 60,000 IU dosing typically advised by a physician?', questionType: 'mcq', options: ['Once weekly for 2–3 weeks', 'Once weekly for 8–12 weeks', 'Once daily for 14 days', 'Once every two months for 6 months'], correctAnswerIndex: 1 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'What is the official brand tagline for GLOWVIT-60K?', questionType: 'mcq', options: ['Shine Stronger', 'Care for Life', 'Advanced Vitamin Power', 'Rapid Bone Relief'], correctAnswerIndex: 0 },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'Which pharmaceutical company markets GLOWVIT-60K with the motto "Enhancing Life, Excelling in Care"?', questionType: 'mcq', options: ['Sun Pharmaceutical Industries Ltd', 'Emyris Biolifesciences Pvt Ltd', 'Cipla Limited', 'Dr. Reddy\'s Laboratories'], correctAnswerIndex: 1 },

                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'Explain the clinical advantages of GLOWVIT-60K\'s "Advanced Vitamin D3 Nano Formula" (including bioavailability, absorption speed, and dosage convenience) over conventional tablets or granules.', questionType: 'descriptive', inputFields: [] },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'Describe the role of GLOWVIT-60K beyond bone density, specifically highlighting its mechanism and benefits in managing Diabetes and Cardiovascular Diseases (CVDs).', questionType: 'descriptive', inputFields: [] },
                { category: 'glowvit-60k', targetProduct: 'GLOWVIT-60K', text: 'List the top 4 doctor specialties you will target for GLOWVIT-60K (e.g. Orthopedists, Gynecologists, Diabetologists/Physicians, Nephrologists) and explain the key clinical benefit you will pitch to each.', questionType: 'descriptive', inputFields: ['Specialty 1 & Pitch', 'Specialty 2 & Pitch', 'Specialty 3 & Pitch', 'Specialty 4 & Pitch'] },

                // ALOMOS GOLD Specific Questions (15 MCQ & 3 Descriptive)
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'What type of protein is used in ALOMOS GOLD and what is its protein concentration per 100gm?', questionType: 'mcq', options: ['Whey Protein Concentrate (60gm/100gm)', 'Whey Protein Isolate (83.4gm/100gm)', 'Soy Protein Isolate (75gm/100gm)', 'Casein Protein (80gm/100gm)'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'How much high-density Whey Protein Isolate (WPI) is delivered in a single 30gm (1 level scoop) serving of ALOMOS GOLD?', questionType: 'mcq', options: ['15 gm', '20 gm', '25 gm', '30 gm'], correctAnswerIndex: 2 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'What is the total amino acid content per 100gm and the exact amount of BCAAs per serving in ALOMOS GOLD?', questionType: 'mcq', options: ['50gm Amino Acids per 100gm; 2,000 mg BCAAs per serving', '76gm Amino Acids per 100gm; 4,706 mg BCAAs per serving', '65gm Amino Acids per 100gm; 3,500 mg BCAAs per serving', '80gm Amino Acids per 100gm; 5,500 mg BCAAs per serving'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'What clinical role do the 4,706 mg of Total BCAAs and 76gm Amino Acids in ALOMOS GOLD play during recovery?', questionType: 'mcq', options: ['They act as a sedative for pain relief', 'They trigger robust Muscle Protein Synthesis (MPS), supporting lean body mass and preventing sarcopenia', 'They lower gastric acid pH immediately', 'They induce systemic vasodilation'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'How much Curcumin Extract is contained per 100gm of ALOMOS GOLD and what is its primary clinical benefit?', questionType: 'mcq', options: ['200 mg per 100gm; acts as a bulk laxative', '500 mg per 100gm; supports post-surgical and anti-inflammatory recovery', '1,000 mg per 100gm; acts as an anticoagulant', '300 mg per 100gm; suppresses appetite'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'Which proprietary multi-enzyme blend is included in ALOMOS GOLD at 1,000 mg per 100gm (300 mg per serving) to ensure enhanced protein bioavailability without GI distress?', questionType: 'mcq', options: ['Pancreatin Extra', 'DigeZyme Enzyme Blend (containing Amylase, Protease, Lactase, Lipase & Cellulase)', 'Bromelain & Papain Complex', 'Pepsin Gold Matrix'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'What is the strength of the infused Probiotic Blend per 100gm and per serving in ALOMOS GOLD?', questionType: 'mcq', options: ['5 Billion CFU per 100gm (1 Billion per serving)', '13.88 Billion CFU per 100gm (4 Billion CFU per serving)', '20 Billion CFU per 100gm (6 Billion per serving)', '2.5 Billion CFU per 100gm (500 Million per serving)'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'How much prebiotic fiber does ALOMOS GOLD contain per 100gm to support gut microbiome health and digestion?', questionType: 'mcq', options: ['5 gm per 100gm', '12 gm per 100gm', '18 gm per 100gm', '25 gm per 100gm'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'What is the Sugar and Gluten status of ALOMOS GOLD, making it clinically safe for diabetic and sensitive patients?', questionType: 'mcq', options: ['Contains 10% added sucrose and low gluten', 'Free Sugar and Gluten Free (0g Sugar, 0g Gluten)', 'Contains artificial sweeteners with wheat protein', 'Contains fructose and maltodextrin'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'How many essential vitamins and minerals are fortified inside ALOMOS GOLD to provide complete clinical micronutrition?', questionType: 'mcq', options: ['12 Vitamins & Minerals', '18 Vitamins & Minerals', '26 Vitamins & Minerals', '32 Vitamins & Minerals'], correctAnswerIndex: 2 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'Which of the following patient groups is ALOMOS GOLD specifically indicated for?', questionType: 'mcq', options: ['Post Bariatric Surgery & Critical Care/Post-Surgical Recovery patients', 'Cancer Cachexia & Sarcopenia/Geriatric Nutrition patients', 'Both A and B (All of the above)', 'Only pediatric asthma patients'], correctAnswerIndex: 2 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'What are the 5-in-1 Clinical Benefits highlighted on the ALOMOS GOLD wheel?', questionType: 'mcq', options: ['High Protein Density, Gut & Absorption Support, Anti-Inflammatory Support, Complete Micronutrition, and Muscle Recovery', 'Rapid Weight Gain, Sedation, Anti-Diarrheal, Bone Calcium, and Joint Lubrication', 'Renal Diuresis, Hepatic Cleansing, Cardiac Pumping, Pulmonary Oxygenation, and Dermal Healing', 'Appetite Suppression, Gastric Acid Blockade, Bile Stimulation, Electrolyte Surge, and Sleep Induction'], correctAnswerIndex: 0 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'What is the recommended dilution and preparation protocol for a single 30gm serving of ALOMOS GOLD?', questionType: 'mcq', options: ['Add 30g to 100ml boiling water and stir immediately', 'Add 30g (1 level scoop) to 200-250ml cold water or unsweetened almond milk in a shaker bottle, shake vigorously for 30-45 seconds, and let stand 1 minute before sipping', 'Mix 30g with hot fruit juice and consume instantly', 'Blend 30g with 500ml warm tap water and drink over 1 hour'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'In what flavor and pack size is ALOMOS GOLD available for patient adherence and convenience?', questionType: 'mcq', options: ['Vanilla Flavour in 500gm tin', 'Chocolate Flavour in 1kg jar', 'Strawberry Flavour in 2kg pouch', 'Unflavored in 250gm box'], correctAnswerIndex: 1 },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'What is the primary brand tagline of ALOMOS GOLD marketed by Emyris Biolifesciences Pvt Ltd?', questionType: 'mcq', options: ['The Gold-Standard Protein Quality / For Empowering Surgical Recovery', 'Rapid Weight Loss Formula', 'The Ultimate Sports Gainer', 'Daily Energy & Stamina Booster'], correctAnswerIndex: 0 },

                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'Explain the clinical superiority of ALOMOS GOLD over standard protein powders in Post-Surgical and ICU Recovery, specifically detailing the synergistic roles of 100% WPI (83.4g), DigeZyme® (1000mg), and Curcumin Extract (500mg).', questionType: 'descriptive', inputFields: [] },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'Write out your exact 2-minute Doctor Detailing Pitch (`In-Clinic Script`) when presenting ALOMOS GOLD to a Bariatric Surgeon or Critical Care Specialist.', questionType: 'descriptive', inputFields: [] },
                { category: 'alomos-gold', targetProduct: 'ALOMOS GOLD', text: 'List the top 4 target doctor specialties in your HQ for ALOMOS GOLD (e.g., Bariatric Surgeons, Critical Care Specialists/Intensivists, Oncologists, Geriatricians/Physicians) and describe the key clinical indication you will emphasize for each.', questionType: 'descriptive', inputFields: ['Specialty 1 & Indication', 'Specialty 2 & Indication', 'Specialty 3 & Indication', 'Specialty 4 & Indication'] },

                // English
                { category: 'english', text: 'Which word is a synonym for "Abundant"?', options: ['Scarce', 'Plentiful', 'Empty', 'Brief'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Identify the verb in the following sentence: "The quick brown fox jumps over the lazy dog."', options: ['quick', 'brown', 'jumps', 'lazy'], correctAnswerIndex: 2 },
                { category: 'english', text: 'Choose the correct spelling:', options: ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'], correctAnswerIndex: 1 },
                { category: 'english', text: 'What is the antonym of "Expand"?', options: ['Grow', 'Increase', 'Shrink', 'Extend'], correctAnswerIndex: 2 },
                { category: 'english', text: 'Which is the correct sentence?', options: ['Their going to the store.', 'There going to the store.', 'They\'re going to the store.', 'They going to the store.'], correctAnswerIndex: 2 },
                { category: 'english', text: 'What does the idiom "Bite the bullet" mean?', options: ['To be angry', 'To endure a painful situation', 'To eat something hard', 'To shoot a gun'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Complete the sentence: "He is looking forward ___ you."', options: ['to see', 'to seeing', 'seeing', 'see'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Choose the correct synonym for "Meticulous":', options: ['Careless', 'Thorough', 'Quick', 'Hesitant'], correctAnswerIndex: 1 },
                { category: 'english', text: 'What is the antonym of "Benevolent"?', options: ['Kind', 'Generous', 'Malevolent', 'Polite'], correctAnswerIndex: 2 },
                { category: 'english', text: 'Identify the adjective in: "She delivered an eloquent presentation to the board."', options: ['delivered', 'eloquent', 'presentation', 'board'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Choose the correct spelling:', options: ['Privilege', 'Priviledge', 'Privelege', 'Privilage'], correctAnswerIndex: 0 },
                { category: 'english', text: 'Complete the proverb: "Actions speak louder than ___."', options: ['words', 'promises', 'thoughts', 'shouting'], correctAnswerIndex: 0 },
                { category: 'english', text: 'What does the idiom "Hit the nail on the head" mean?', options: ['To cause an accident', 'To describe exactly what is causing a situation', 'To work very hard in construction', 'To get a headache'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Choose the grammatically correct sentence:', options: ['Neither the manager nor the employees was present.', 'Neither the manager nor the employees were present.', 'Neither the manager or the employees were present.', 'Neither manager nor employees is present.'], correctAnswerIndex: 1 },
                { category: 'english', text: 'What is the synonym of "Pragmatic"?', options: ['Practical', 'Idealistic', 'Confused', 'Theoretical'], correctAnswerIndex: 0 },
                { category: 'english', text: 'Fill in the blank: "We must adapt ___ the changing market conditions."', options: ['with', 'to', 'for', 'at'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Which word means "a person who is new to a subject or activity"?', options: ['Veteran', 'Novice', 'Expert', 'Mentor'], correctAnswerIndex: 1 },
                { category: 'english', text: 'What is the correct plural form of "Analysis"?', options: ['Analysises', 'Analysi', 'Analyses', 'Analysis'], correctAnswerIndex: 2 },
                { category: 'english', text: 'What does the word "Lucid" mean?', options: ['Dark and murky', 'Clear and easy to understand', 'Complicated', 'Angry'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Fill in the blank: "She has been working here ___ 2018."', options: ['since', 'for', 'from', 'in'], correctAnswerIndex: 0 },
                
                // Current Affairs
                { category: 'current_affairs', text: 'Which organization is responsible for global health issues?', options: ['IMF', 'WTO', 'WHO', 'UNICEF'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'What is the primary currency used in the European Union?', options: ['Dollar', 'Pound', 'Euro', 'Franc'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'Which country is the largest emitter of carbon dioxide globally?', options: ['USA', 'India', 'China', 'Russia'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'What is the capital of Ukraine?', options: ['Moscow', 'Minsk', 'Kyiv', 'Warsaw'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'Which tech company produces the iPhone?', options: ['Microsoft', 'Google', 'Samsung', 'Apple'], correctAnswerIndex: 3 },
                { category: 'current_affairs', text: 'What is the name of the central bank of India?', options: ['SBI', 'RBI', 'HDFC', 'ICICI'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'BRICS is an intergovernmental organization comprising Brazil, Russia, India, China, and which other country?', options: ['South Korea', 'Saudi Arabia', 'South Africa', 'Spain'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'Which global summit focuses on climate change negotiations among world leaders?', options: ['G20', 'COP', 'NATO', 'OPEC'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'What is the primary objective of the World Trade Organization (WTO)?', options: ['Regulate global banking', 'Regulate international trade', 'Provide military aid', 'Manage currency exchange rates'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'Which country hosted the 2024 Summer Olympic Games?', options: ['Japan', 'USA', 'France', 'Australia'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'What does the acronym "AI" stand for in modern technology?', options: ['Automated Interface', 'Artificial Intelligence', 'Applied Internet', 'Advanced Integration'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'Which major space agency successfully landed the Chandrayaan-3 mission on the lunar south pole?', options: ['NASA', 'ESA', 'ISRO', 'JAXA'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'What is the name of the global initiative aimed at sustainable development goals by 2030?', options: ['UN SDG 2030', 'Kyoto Protocol', 'Paris Vision', 'Global Compact'], correctAnswerIndex: 0 },
                { category: 'current_affairs', text: 'Which sector is primarily associated with the term "Fintech"?', options: ['Agriculture & Farming', 'Financial Technology & Banking', 'Pharmaceutical Research', 'Textile Manufacturing'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'Which international body oversees global monetary cooperation and financial stability?', options: ['World Bank', 'International Monetary Fund (IMF)', 'Asian Development Bank', 'Federal Reserve'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'What is the term used for the transition towards renewable energy and reducing carbon footprints globally?', options: ['Green Transition', 'Industrial Revolution', 'Digital Transformation', 'Urbanization'], correctAnswerIndex: 0 },
                { category: 'current_affairs', text: 'Which organization awards the Nobel Peace Prize annually?', options: ['Swedish Academy', 'Norwegian Nobel Committee', 'UN Security Council', 'World Court'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'In international healthcare, what does "WHO" stand for?', options: ['World Health Organization', 'World Healing Order', 'Western Healthcare Organization', 'Global Health Office'], correctAnswerIndex: 0 },
                
                // General Knowledge
                { category: 'gk', text: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'Who wrote the play "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'What is the largest ocean on Earth?', options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], correctAnswerIndex: 3 },
                { category: 'gk', text: 'How many continents are there in the world?', options: ['5', '6', '7', '8'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'Who is known as the Father of the Indian Constitution?', options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Dr. B.R. Ambedkar', 'Sardar Patel'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'What is the tallest mountain in the world?', options: ['K2', 'Mount Everest', 'Kangchenjunga', 'Lhotse'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'Which organ in the human body is primarily responsible for filtering blood and removing toxins?', options: ['Heart', 'Liver', 'Lungs', 'Stomach'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'Which gas makes up the majority of Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'What is the speed of light in a vacuum approximately?', options: ['300,000 km/s', '150,000 km/s', '1,000 km/s', '3,000,000 km/s'], correctAnswerIndex: 0 },
                { category: 'gk', text: 'Who is credited with discovering penicillin?', options: ['Louis Pasteur', 'Alexander Fleming', 'Marie Curie', 'Isaac Newton'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'What is the normal human body temperature in Celsius?', options: ['35°C', '37°C', '39°C', '40°C'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'Which vitamin is produced by the human body when exposed to sunlight?', options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], correctAnswerIndex: 3 },
                { category: 'gk', text: 'What is the chemical formula for table salt?', options: ['NaCl', 'H2O', 'CO2', 'KCl'], correctAnswerIndex: 0 },
                { category: 'gk', text: 'In business and finance, what does "ROI" stand for?', options: ['Return On Investment', 'Rate Of Inflation', 'Risk On Income', 'Revenue Over Interest'], correctAnswerIndex: 0 },
                { category: 'gk', text: 'Which blood group is known as the universal donor?', options: ['A positive', 'AB positive', 'O negative', 'B negative'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'What is the boiling point of water at standard atmospheric pressure?', options: ['50°C', '100°C', '150°C', '200°C'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'What is the primary function of DNA in living organisms?', options: ['Store genetic information', 'Provide structural support', 'Digest food', 'Transport oxygen'], correctAnswerIndex: 0 }
            ];
            const existingQs = await OnboardQuestion.findAll({ attributes: ['text'] });
            const existingTexts = new Set(existingQs.map(q => q.text));
            const newQsToSeed = seedQuestions.filter(q => !existingTexts.has(q.text));
            if (newQsToSeed.length > 0) {
                console.log(`🌱 Seeding ${newQsToSeed.length} new Rapid Test questions into database...`);
                let seededCount = 0;
                for (const q of newQsToSeed) {
                    try {
                        await OnboardQuestion.create({ _id: generateId(), ...q });
                        seededCount++;
                    } catch (createErr) {
                        console.error(`⚠️ Question create failed for "${q.text.substring(0, 35)}...":`, createErr.message);
                    }
                }
                console.log(`✅ Seeded ${seededCount} new questions successfully.`);
            }
        } catch (err) {
            console.error('⚠️ Question seeding check failed:', err.message);
        }

        // ONE-TIME FIX for buggy scores
        try {
            const [exams] = await sequelize.query("SELECT * FROM onboard_exam_results");
            let fixedCount = 0;
            const [questions] = await sequelize.query("SELECT * FROM onboard_questions");
            
            for (let exam of exams) {
                let answers = exam.answers;
                if (typeof answers === 'string') {
                    try { answers = JSON.parse(answers); } catch(e){}
                }
                
                if (answers && Object.keys(answers).length > 0) {
                    let actualMcq = 0;
                    let actualDesc = 0;
                    const qIds = Object.keys(answers);
                    
                    for (let qId of qIds) {
                        const q = questions.find(qu => qu._id === qId || qu.text === qId);
                        if (q) {
                            if (q.questionType === 'mcq') actualMcq++;
                            else actualDesc++;
                        }
                    }
                    
                    if (actualMcq > 0 || actualDesc > 0) {
                        let actualAutoScore = 0;
                        for (let [qId, selectedIdxOrText] of Object.entries(answers)) {
                            const q = questions.find(qu => qu._id === qId || qu.text === qId);
                            if (q && q.questionType === 'mcq') {
                                const isSkipped = selectedIdxOrText === "" || selectedIdxOrText === null || selectedIdxOrText === undefined;
                                if (!isSkipped && (q.correctAnswerIndex === Number(selectedIdxOrText) || (q.options && q.options[q.correctAnswerIndex] === selectedIdxOrText))) {
                                    actualAutoScore++;
                                }
                            }
                        }

                        let changed = false;
                        if (exam.mcqTotal !== actualMcq) changed = true;
                        if (exam.descTotal !== actualDesc) changed = true;
                        if (exam.totalQuestions !== qIds.length) changed = true;
                        if (exam.autoScore !== actualAutoScore) changed = true;
                        
                        if (changed) {
                            const newTotalScore = actualAutoScore + (exam.manualScore || 0);
                            await sequelize.models.onboard_exam_result.update(
                                { mcqTotal: actualMcq, descTotal: actualDesc, totalQuestions: qIds.length, autoScore: actualAutoScore, totalScore: newTotalScore },
                                { where: { _id: exam._id } }
                            );
                            
                            if (exam.testedProduct && exam.testedProduct.toLowerCase().includes('rapid')) {
                                await sequelize.models.onboard_applicant.update(
                                    { rapidTestScore: actualAutoScore },
                                    { where: { email: exam.email } }
                                );
                            }
                            
                            fixedCount++;
                        }
                    }
                }
            }
            if (fixedCount > 0) console.log(`✅ Fixed ${fixedCount} historical exam records.`);
            
            // Hard reset briskheal's corrupted rapid score using ORM to avoid Postgres table name mismatches
            await sequelize.models.onboard_applicant.update(
                { rapidTestScore: 0 },
                { where: { email: 'briskheal@gmail.com' } }
            );
            
        } catch (err) {
            console.error('⚠️ DB fix failed:', err.message);
        }

        try {
            const prodCount = await XlProduct.count();
            if (prodCount === 0) {
                const fs = require('fs');
                const path = require('path');
                const seedPath = path.join(__dirname, 'product_seed.json');
                if (fs.existsSync(seedPath)) {
                    const seedData = require(seedPath);
                    await XlProduct.bulkCreate(seedData);
                    console.log(`✅ Dynamically seeded ${seedData.length} products into the live database from Excel data!`);
                }
            }
        } catch (e) {
            console.error('⚠️ Product seed failed:', e.message);
        }

    } catch (err) {
        console.error('❌ Database connection error:', err.message);
    }
}

module.exports = { 
    sequelize, 
    syncDatabase, 
    Company, 
    Asset, 
    Applicant, 
    Division, 
    HQ, 
    TemplateHistory, 
    Question, 
    ExamResult, 
    Payslip, 
    LeaveType, 
    LeaveBalance,
    LeaveRequest,
    LoanType,
    AssignedLoan,
    AssignedAdvance,
    XlDoctor,
    XlChemist,
    XlStockist,
    XlState,
    XlHQ,
    XlCity,
    XlRoute, XlDivision, XlDesignation, XlUser, XlAdmin,
    XlTourProgram,
    XlDCR,
    XlAttendance,
    XlLeave,
    XlExpense,
    XlBacklogRequest,
    XlCallPlan, XlProductCategory, XlProductType, XlProduct, XlProductSupplier, XlInventory,
    generateId 
};
