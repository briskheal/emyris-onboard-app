require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function pushToLive() {
    try {
        console.log("Preparing to push ALOMOS MAMA questions to LIVE server...");
        
        const auth = {
            username: process.env.ADMIN_USER,
            password: process.env.ADMIN_PASS
        };

        const categoryName = 'ALOMOS MAMA';

        const questionsToUpload = [
            // 15 MCQs
            { category: categoryName, text: 'What is the primary indication of ALOMOS MAMA?', questionType: 'mcq', options: ['High Protein Maternal Nutrition Supplement', 'Management of Diabetes', 'Pediatric Weight Gain', 'Cancer Cachexia'], correctAnswerIndex: 0 },
            { category: categoryName, text: 'How much protein does ALOMOS MAMA contain per 100gm?', questionType: 'mcq', options: ['25 gm', '28 gm', '33 gm', '40 gm'], correctAnswerIndex: 2 },
            { category: categoryName, text: 'What is the primary source of protein in ALOMOS MAMA?', questionType: 'mcq', options: ['100% Whey Protein Isolate', 'Soy Protein Isolate', 'Casein', 'Pea Protein'], correctAnswerIndex: 0 },
            { category: categoryName, text: 'What is the DIAAS percentage for the protein in ALOMOS MAMA?', questionType: 'mcq', options: ['90%', '100%', '110%', '120%'], correctAnswerIndex: 2 },
            { category: categoryName, text: 'According to the profile, what is the main benefit of Whey Protein Isolate in ALOMOS MAMA?', questionType: 'mcq', options: ['Improves maternal hair growth', 'Maintains fetal lean body mass & reduces risk of low birth weight', 'Reduces risk of gestational diabetes mellitus', 'Prevents morning sickness'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'How much DHA is present in ALOMOS MAMA per 100gm?', questionType: 'mcq', options: ['50 mg', '100 mg', '200 mg', '500 mg'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'What is the critical role of DHA in the third trimester as per ALOMOS MAMA profile?', questionType: 'mcq', options: ['Improves maternal bone density', 'Reduces the risk of pre-term birth', 'Prevents anemia', 'Increases milk production'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'Which component in ALOMOS MAMA helps to reduce the risk of gestational diabetes mellitus?', questionType: 'mcq', options: ['Whey Protein Isolate', 'Dietary Fibre', 'DHA', 'Hemo Nutrients'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'What are the three Hemo Nutrients included in ALOMOS MAMA to maintain healthy red blood cells?', questionType: 'mcq', options: ['Iron, Calcium, Vitamin D3', 'Iron, Folic Acid, Vitamin B12', 'Zinc, Selenium, Vitamin C', 'Magnesium, Copper, Biotin'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'What is the primary function of Probiotics (3.24 B CFU) in ALOMOS MAMA?', questionType: 'mcq', options: ['Provides dual support for both immune and G.I. function', 'Enhances fetal brain development', 'Prevents anemia', 'Reduces gestational diabetes risk'], correctAnswerIndex: 0 },
            { category: categoryName, text: 'How many vitamins and minerals are present in ALOMOS MAMA?', questionType: 'mcq', options: ['15', '20', '27', '29'], correctAnswerIndex: 2 },
            { category: categoryName, text: 'ALOMOS MAMA is free from which of the following ingredients?', questionType: 'mcq', options: ['Gluten, Sugar, Trans Fat', 'Lactose, Soy, Nuts', 'Artificial Flavours, Colours, Preservatives', 'Maltodextrin, Fructose, Sucralose'], correctAnswerIndex: 0 },
            { category: categoryName, text: 'Which of the following is a complete amino acid prominently present in ALOMOS MAMA?', questionType: 'mcq', options: ['L-Arginine', 'L-Carnitine', 'Taurine', 'Creatine'], correctAnswerIndex: 0 },
            { category: categoryName, text: 'What are the three available flavours of ALOMOS MAMA?', questionType: 'mcq', options: ['Vanilla, Strawberry, Banana', 'Chocolate, American Ice Cream, Keshar Elaichi', 'Mango, Butterscotch, Pistachio', 'Coffee, Caramel, Mixed Berry'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'What is the recommended dilution method to prepare one feed of ALOMOS MAMA?', questionType: 'mcq', options: ['1 scoop in 100ml water', '3 scoops in 250ml milk', '2 scoops (approx 30g) in 200ml milk/water', '4 scoops in 190ml water'], correctAnswerIndex: 2 },
            
            // 3 Descriptive
            { category: categoryName, text: 'What is the tagline of ALOMOS MAMA?', questionType: 'descriptive', inputFields: ['Tagline'] },
            { category: categoryName, text: 'Write 4 competitors brand names for ALOMOS MAMA.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3', 'Space 4'] },
            { category: categoryName, text: 'Write 3 major prescribing doctors or consuming hospitals in your HQ for ALOMOS MAMA.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3'] }
        ];

        for (const q of questionsToUpload) {
            try {
                q.targetProduct = categoryName; 
                await axios.post('https://emyrishr.in/api/admin/questions', q, { auth });
                console.log('Successfully pushed:', q.text);
            } catch (err) {
                console.log('Error pushing:', q.text, err.response ? err.response.statusText : err.message);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
pushToLive();
