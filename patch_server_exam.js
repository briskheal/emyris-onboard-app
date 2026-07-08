const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const regexAPI = /app\.post\('\/api\/applicant\/exam-questions', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, questions: safeQuestions \}\);\s*\} catch \(e\) \{/;

const newAPI = `app.post('/api/applicant/exam-questions', async (req, res) => {
    try {
        const company = await Company.findOne();
        const activeProduct = company && company.activeExamProduct ? company.activeExamProduct : '';
        const questions = await Question.find({ active: true });
        
        // 1. Gather all potential product questions
        let allProductQs = questions.filter(q => 
            q.category === 'exam_product' || 
            (activeProduct && q.targetProduct === activeProduct) || 
            (activeProduct && q.category.toLowerCase() === activeProduct.toLowerCase()) ||
            q.category.toLowerCase() === 'emystein' // Fallback for legacy DB structure
        );
        
        // 2. Gather all potential CA/Market Intelligence questions
        let allCaQs = questions.filter(q => 
            q.category === 'exam_current_affairs' || 
            q.category === 'current_affairs' // Fallback
        );
        
        // 3. Ensure a mix of MCQ and Descriptive for Phase 1 and Phase 2
        let mcqProductQs = allProductQs.filter(q => q.questionType === 'mcq').sort(() => 0.5 - Math.random()).slice(0, 7);
        let descProductQs = allProductQs.filter(q => q.questionType === 'descriptive').sort(() => 0.5 - Math.random()).slice(0, 3);
        
        let mcqCaQs = allCaQs.filter(q => q.questionType === 'mcq').sort(() => 0.5 - Math.random()).slice(0, 3);
        let descCaQs = allCaQs.filter(q => q.questionType === 'descriptive').sort(() => 0.5 - Math.random()).slice(0, 2);
        
        // Backfill if not enough descriptive questions exist
        if (descProductQs.length < 3) {
            const extraMcq = allProductQs.filter(q => q.questionType === 'mcq' && !mcqProductQs.includes(q)).sort(() => 0.5 - Math.random()).slice(0, 3 - descProductQs.length);
            mcqProductQs.push(...extraMcq);
        }
        if (descCaQs.length < 2) {
            const extraMcq = allCaQs.filter(q => q.questionType === 'mcq' && !mcqCaQs.includes(q)).sort(() => 0.5 - Math.random()).slice(0, 2 - descCaQs.length);
            mcqCaQs.push(...extraMcq);
        }
        
        // 4. Combine and shuffle
        const selected = [...mcqProductQs, ...descProductQs, ...mcqCaQs, ...descCaQs].sort(() => 0.5 - Math.random());
        
        const safeQuestions = selected.map(q => ({
            _id: q._id,
            category: q.category,
            questionType: q.questionType,
            text: q.text,
            options: q.options,
            inputFields: q.inputFields,
            correctAnswerIndex: q.correctAnswerIndex
        }));
        
        res.json({ success: true, questions: safeQuestions });
    } catch (e) {`;

if (regexAPI.test(serverJs)) {
    serverJs = serverJs.replace(regexAPI, newAPI);
    fs.writeFileSync('server.js', serverJs);
    console.log('Successfully patched exam-questions API');
} else {
    console.log('Failed to match exam-questions API using regex');
}
