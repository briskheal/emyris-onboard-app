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
    } : {}
});

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Import schemas and adapter
const { MongooseAdapter } = require('./models/adapter');
const initModels = require('./models/pgModels');

const {
    OnboardCompany,
    OnboardAsset,
    OnboardApplicant,
    OnboardDivision,
    OnboardHQ,
    OnboardTemplateHistory,
    OnboardQuestion,
    OnboardExamResult
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

// Database Sync and Seed Function
async function syncDatabase() {
    try {
        try {
            await sequelize.sync({ alter: true });
        } catch (alterErr) {
            console.warn('⚠️ Sync alter warning (falling back to standard sync):', alterErr.message);
            await sequelize.sync();
        }
        console.log('✅ Synchronized onboard_* tables in database.');

        // Seed Default Company only if missing. Never overwrite existing targetProductsList if admin deleted/edited items.
        let c = await Company.findOne();
        let defaultProducts = ['General', 'Emystein', 'ALOMOS HP ADVANCED', 'GLOWVIT-60K'];
        // Also extract any distinct product/category labels from seedQuestions
        if (typeof seedQuestions !== 'undefined' && Array.isArray(seedQuestions)) {
            seedQuestions.forEach(sq => {
                if (sq.targetProduct && sq.targetProduct !== 'General' && !defaultProducts.includes(sq.targetProduct)) {
                    defaultProducts.push(sq.targetProduct);
                }
                if (sq.category && !['math', 'english', 'current_affairs', 'gk', 'exam_product', 'exam_current_affairs', 'general'].includes(sq.category.toLowerCase())) {
                    const formattedCat = sq.category.toUpperCase().includes('GLOWVIT') ? 'GLOWVIT-60K' : sq.category;
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
            console.log('ℹ️ Company profile already exists. Preserving admin targetProductsList exactly.');
        }

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

    } catch (err) {
        console.error('❌ Database connection error:', err.message);
    }
}

module.exports = {
    sequelize,
    syncDatabase,
    Company,
    Applicant,
    Division,
    HQ,
    Asset,
    TemplateHistory,
    Question,
    ExamResult
};
