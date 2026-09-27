require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function pushToLive() {
    try {
        console.log("Preparing to push ALOMOS DM questions to LIVE server...");
        
        const auth = {
            username: process.env.ADMIN_USER,
            password: process.env.ADMIN_PASS
        };

        const categoryName = 'ALOMOS DM';

        const questionsToUpload = [
            { category: categoryName, text: 'What is the primary indication for ALOMOS DM?', questionType: 'mcq', options: ['Management of Hypertension', 'Management of Diabetes', 'Cancer Cachexia', 'Osteoporosis'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'How much protein does 100gm of ALOMOS DM contain?', questionType: 'mcq', options: ['14 gm', '28 gm', '50 gm', '12 gm'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'What is the Glycemic Index (GI) and Glycemic Load (GL) of ALOMOS DM?', questionType: 'mcq', options: ['GI 25, GL 3', 'GI 40, GL 10', 'GI 15, GL 5', 'GI 55, GL 15'], correctAnswerIndex: 0 },
            { category: categoryName, text: 'Which three protein sources make up the Triple Protein Blend with a PDCAAS of 1.0 in ALOMOS DM?', questionType: 'mcq', options: ['Whey, Pea, Rice', 'Casein, Soy, Pea', 'Whey, Casein, Soy', 'Egg, Whey, Casein'], correctAnswerIndex: 2 },
            { category: categoryName, text: 'Which botanical extract in ALOMOS DM is specifically included to block sugar absorption?', questionType: 'mcq', options: ['Cinnamon Extract', 'Berberine', 'Gymnema sylvestre', 'Monk Fruit Extract'], correctAnswerIndex: 2 },
            { category: categoryName, text: 'What is the specific clinical role of Berberine as highlighted in the ALOMOS DM profile?', questionType: 'mcq', options: ['Improves insulin sensitivity', 'Reduces HbA1c', 'Improves Satiety', 'Blocks sugar absorption'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'How much Chromium is present in ALOMOS DM to enhance insulin function?', questionType: 'mcq', options: ['100mcg', '200mcg', '300mcg', '400mcg'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'Which natural sweetening system is used in ALOMOS DM to provide zero glycemic impact with no aftertaste?', questionType: 'mcq', options: ['Stevia Extract', 'Sucralose', 'Erythritol', 'Monk Fruit Extract'], correctAnswerIndex: 3 },
            { category: categoryName, text: 'What is the composition of the prebiotic blend in ALOMOS DM designed for gut health support?', questionType: 'mcq', options: ['FOS + Inulin', 'Resistant Maltodextrin only', 'Pectin + Cellulose', 'Beta-glucan'], correctAnswerIndex: 0 },
            { category: categoryName, text: 'What is the recommended preparation for a single feed of ALOMOS DM?', questionType: 'mcq', options: ['2 scoops in 100 ml of water', '4 level scoops (approx 50g) in 190 ml of water', '3 scoops in 250 ml of milk', '1 scoop in 50 ml of water'], correctAnswerIndex: 1 },
            { category: categoryName, text: 'What ingredient is used as a base in ALOMOS DM to achieve a "True Low Glycemic Index"?', questionType: 'mcq', options: ['Maltodextrin', 'Fructose', 'Resistant Maltodextrin', 'Sucrose'], correctAnswerIndex: 2 },
            { category: categoryName, text: 'What percentage of the fat content in ALOMOS DM is composed of heart-healthy MUFA?', questionType: 'mcq', options: ['50%', '62%', '72%', '85%'], correctAnswerIndex: 2 },
            { category: categoryName, text: 'What is the MRP of ALOMOS DM?', questionType: 'descriptive', inputFields: [] },
            { category: categoryName, text: 'Write 4 competitors brand names for ALOMOS DM.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3', 'Space 4'] },
            { category: categoryName, text: 'Write 3 major consuming hospitals in your HQ for ALOMOS DM.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3'] }
        ];

        for (const q of questionsToUpload) {
            try {
                // Ensure targetProduct matches category exactly to avoid previous bugs
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
