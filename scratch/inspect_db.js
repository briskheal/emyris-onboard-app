const { Applicant, ExamResult, Question } = require('../db.js');
const fs = require('fs');

async function run() {
    try {
        console.log('=== EXAM RESULTS ===');
        const exams = await ExamResult.find({});
        for (let ex of exams) {
            console.log(`Email: ${ex.email}, Name: ${ex.name}, Product: ${ex.testedProduct}, Status: ${ex.status}, AutoScore: ${ex.autoScore}, ManualScore: ${ex.manualScore}, TotalQ: ${ex.totalQuestions}`);
            console.log('Answers keys:', Object.keys(ex.answers || {}));
            console.log('Answers sample:', JSON.stringify(ex.answers).substring(0, 300));
        }

        console.log('\n=== APPLICANTS (LATEST 10) ===');
        const apps = await Applicant.find({});
        apps.slice(-10).forEach(a => {
            console.log(`Email: ${a.email}, Name: ${a.fullName}, PsychometricCompleted: ${a.psychometricTestCompleted}`);
            console.log(`  Scores: ${a.psychometricScores ? a.psychometricScores.substring(0, 100) : 'MISSING'}`);
            console.log(`  Report: ${a.mindsetReport ? a.mindsetReport.substring(0, 100) : 'MISSING'}`);
        });

        console.log('\n=== QUESTIONS SUMMARY ===');
        const qs = await Question.find({});
        console.log('Total Questions:', qs.length);
        const descQs = qs.filter(q => q.questionType === 'descriptive');
        console.log('Descriptive Questions total:', descQs.length);
        descQs.forEach(q => {
            console.log(`  ID: ${q._id}, Cat: ${q.category}, Target: ${q.targetProduct}, Text: ${q.text.substring(0, 60)}`);
        });

        console.log('\n=== SEARCH ADMIN-SCRIPT.JS FOR GRADING ===');
        const js = fs.readFileSync('admin-script.js', 'utf8').split('\n');
        js.forEach((l, i) => {
            if (l.includes('openGradingModal') || l.includes('submitExamGrade') || l.includes('hasDescriptive') || l.includes('No descriptive answers')) {
                console.log(`Line ${i+1}: ${l.trim()}`);
            }
        });

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
