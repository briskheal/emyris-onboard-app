const { syncDatabase, Question } = require('../db.js');

async function uploadQuestions() {
    await syncDatabase();
    console.log("Connected to DB.");
    
    const categoryName = 'alomos hp advanced';
    const targetProduct = 'ALOMOS HP ADVANCED';

    const questionsToUpload = [
        { category: categoryName, targetProduct: targetProduct, text: 'What is the primary source of protein in ALOMOS HP ADVANCED?', questionType: 'mcq', options: ['Soy Protein Isolate', '100% Whey Protein Isolate', 'Casein Protein', 'Pea Protein'], correctAnswerIndex: 1 },
        { category: categoryName, targetProduct: targetProduct, text: 'How much protein does a single 100gm serving of ALOMOS HP ADVANCED provide?', questionType: 'mcq', options: ['25 gm', '38 gm', '50 gm', '12.5 gm'], correctAnswerIndex: 2 },
        { category: categoryName, targetProduct: targetProduct, text: 'What is the DIAAS (Digestible Indispensable Amino Acid Score) percentage of this product?', questionType: 'mcq', options: ['90%', '100%', '110%', '120%'], correctAnswerIndex: 2 },
        { category: categoryName, targetProduct: targetProduct, text: 'Which dual prebiotic fibers are included in the innovative formula to improve gut function?', questionType: 'mcq', options: ['RMD & Inulin', 'FOS & GOS', 'Pectin & Cellulose', 'Beta-glucan & Psyllium'], correctAnswerIndex: 0 },
        { category: categoryName, targetProduct: targetProduct, text: 'According to RCTs, RMD showed a significant improvement in Insulin Resistance (IR) by what percentage?', questionType: 'mcq', options: ['12.5%', '22.8%', '24.9%', '37.0%'], correctAnswerIndex: 2 },
        { category: categoryName, targetProduct: targetProduct, text: 'Which natural, zero-calorie extract is used for sweetening ALOMOS HP ADVANCED?', questionType: 'mcq', options: ['Stevia Extract', 'Monk Fruit Extract', 'Erythritol', 'Sucralose'], correctAnswerIndex: 1 },
        { category: categoryName, targetProduct: targetProduct, text: 'Which of the following conditions is ALOMOS HP ADVANCED specifically indicated for to help preserve muscle mass and support immune function?', questionType: 'mcq', options: ['Hypertension', 'Cancer Cachexia', 'Osteoporosis', 'Migraines'], correctAnswerIndex: 1 },
        { category: categoryName, targetProduct: targetProduct, text: 'What is the recommended dilution method for preparing a standard feed of ALOMOS HP ADVANCED?', questionType: 'mcq', options: ['Add 1 scoop to 100 ml of water', 'Add 2 level scoops (approx. 25g) to 150 ml of water/milk', 'Add 3 scoops to 250 ml of water', 'Add 2 level scoops to 50 ml of water/milk'], correctAnswerIndex: 1 },
        { category: categoryName, targetProduct: targetProduct, text: 'Which bioavailable micronutrients (Vitamins) are prominently featured in the formula alongside 28 vitamins & minerals?', questionType: 'mcq', options: ['Vitamin A & Vitamin E', 'Vitamin B12 & Folic Acid', 'Vitamin D3 & K2-MK7', 'Vitamin B6 & Magnesium'], correctAnswerIndex: 2 },
        { category: categoryName, targetProduct: targetProduct, text: 'How much energy (in kilocalories) does a standard single feed (25g / 2 scoops) provide?', questionType: 'mcq', options: ['90 Kcal', '150 Kcal', '250 Kcal', '360 Kcal'], correctAnswerIndex: 0 },
        { category: categoryName, targetProduct: targetProduct, text: 'What is the MRP of ALOMOS HP ADVANCED?', questionType: 'descriptive', inputFields: [] },
        { category: categoryName, targetProduct: targetProduct, text: 'Write 4 competitors brand names for ALOMOS HP ADVANCED.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3', 'Space 4'] },
        { category: categoryName, targetProduct: targetProduct, text: 'Write 3 major consuming hospitals in your HQ for ALOMOS HP ADVANCED.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3'] }
    ];

    let count = 0;
    for (const q of questionsToUpload) {
        try {
            await Question.create(q);
            count++;
        } catch (e) {
            console.log("Error inserting:", q.text, e.message);
        }
    }
    
    console.log(`Successfully inserted ${count} questions.`);
}

uploadQuestions().then(() => process.exit(0)).catch(e => console.error(e));
