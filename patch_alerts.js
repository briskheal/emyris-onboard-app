const fs = require('fs');
let scriptJs = fs.readFileSync('script.js', 'utf8');

const regexSubmit1 = /function submitPhase1\(\) \{[\s\S]*?ongoingExamPhase = 2;/;
const newSubmit1 = `function submitPhase1() {
    let mcqTotal = 0;
    let mcqScore = 0;
    
    ongoingExamQuestions.forEach(q => {
        if (q.questionType === 'mcq') {
            mcqTotal++;
            if (ongoingExamAnswers[q._id] !== undefined && Number(ongoingExamAnswers[q._id]) === q.correctAnswerIndex) {
                mcqScore++;
            }
        }
    });

    alert(\`Phase 1 Complete!\\nYour MCQ Score: \${mcqScore} out of \${mcqTotal}\\n\\nYou will now proceed to the Descriptive Assessment.\`);

    ongoingExamPhase = 2;`;

if (regexSubmit1.test(scriptJs)) {
    scriptJs = scriptJs.replace(regexSubmit1, newSubmit1);
} else {
    console.log("Failed to patch submitPhase1");
}

const regexSubmit2 = /alert\('Exam submitted successfully!'\);/;
const newSubmit2 = `alert('Exam submitted successfully! Your final result will be declared after the Admin reviews your Descriptive Assessment.');`;

if (scriptJs.includes("alert('Exam submitted successfully!');")) {
    scriptJs = scriptJs.replace("alert('Exam submitted successfully!');", newSubmit2);
} else {
    console.log("Failed to patch submitOngoingExam alert");
}

fs.writeFileSync('script.js', scriptJs);
console.log("Patched script.js with scoring alerts");
