const { Applicant, ExamResult } = require('./db');

async function check() {
  try {
    const email = 'himanshu.vashisth8@gmail.com';
    const app = await Applicant.findOne({ email });
    console.log("Applicant Record:");
    console.log(`- Status: ${app.status}`);
    console.log(`- targetProductsList: ${app.targetProductsList}`);
    
    // Check exam results
    const results = await ExamResult.find({ applicantEmail: email });
    console.log(`\nFound ${results.length} Exam Results:`);
    for (const r of results) {
        console.log(`\nExam Type: ${r.examType}`);
        console.log(`- Score: ${r.score}`);
        console.log(`- Total Questions: ${r.totalQuestions}`);
        console.log(`- isGhost: ${r.isGhost}`);
        console.log(`- status: ${r.status}`);
        
        let answers = r.answers;
        if (typeof answers === 'string') {
            try { answers = JSON.parse(answers); } catch(e) {}
        }
        
        if (Array.isArray(answers)) {
            const correctCount = answers.filter(a => a.isCorrect === true).length;
            console.log(`- Calculated Correct Answers in Array: ${correctCount} / ${answers.length}`);
        } else if (answers) {
            console.log(`- Answers object keys:`, Object.keys(answers));
            console.log(`- internalScore (if any):`, answers.internalScore);
            console.log(`- internalTotal (if any):`, answers.internalTotal);
        }
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
check();
