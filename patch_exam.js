const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// 1. Add ongoingExamPhase
if (!code.includes('let ongoingExamPhase = 1;')) {
    code = code.replace(/let ongoingExamTimerInterval;/g, 'let ongoingExamTimerInterval;\nlet ongoingExamPhase = 1;');
}

// 2. startOngoingExam
const startOngoingExamRegex = /async function startOngoingExam\(\) \{[\s\S]*?function renderOngoingExamQuestions\(\)/;
const startOngoingExamNew = `async function startOngoingExam() {
    lockUI('⏳ Preparing your exam...');
    try {
        const res = await fetch('/api/applicant/exam-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email })
        });
        const data = await res.json();
        
        if (data.success && data.questions && data.questions.length > 0) {
            ongoingExamQuestions = data.questions;
            ongoingExamAnswers = {};
            ongoingExamPhase = 1;
            
            renderOngoingExamQuestions();
            
            document.getElementById('examIntroSection').classList.add('hidden');
            document.getElementById('examQuestionsContainer').classList.remove('hidden');
            
            const submitBtn = document.getElementById('submitExamBtn');
            submitBtn.classList.remove('hidden');
            submitBtn.innerText = 'Submit MCQ & Continue';
            // IMPORTANT: Unbind the old inline onclick
            submitBtn.removeAttribute('onclick');
            submitBtn.onclick = submitPhase1;
            
            document.getElementById('floatingExamTimer').style.display = 'flex';
            startOngoingExamTimer(15 * 60); // 15 mins
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(data.message || 'No questions available for today.');
        }
    } catch (e) {
        console.error(e);
        alert('Error loading exam. Please check your connection.');
    } finally {
        unlockUI();
    }
}

function submitPhase1() {
    ongoingExamPhase = 2;
    renderOngoingExamQuestions();
    
    const submitBtn = document.getElementById('submitExamBtn');
    submitBtn.innerText = 'Submit Final Exam';
    submitBtn.onclick = submitOngoingExam;
    
    startOngoingExamTimer(15 * 60); // Reset timer for 15 mins
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('Phase 1 Submitted! You now have 15 minutes for the Descriptive section. You cannot return to the previous section.');
}

function renderOngoingExamQuestions()`;

code = code.replace(startOngoingExamRegex, startOngoingExamNew);

// 3. renderOngoingExamQuestions logic
const renderLoopRegex = /ongoingExamQuestions\.forEach\(\(q, idx\) => \{/;
const renderLoopNew = `let displayedIndex = 0;
    ongoingExamQuestions.forEach((q) => {
        if (ongoingExamPhase === 1 && q.questionType !== 'mcq') return;
        if (ongoingExamPhase === 2 && q.questionType === 'mcq') return;
        displayedIndex++;`;
code = code.replace(renderLoopRegex, renderLoopNew);

// Fix idx to displayedIndex in the loop
code = code.replace(/\$\{idx\+1\}/g, '${displayedIndex}');

// 4. startOngoingExamTimer
const timerRegex = /function startOngoingExamTimer\(seconds\) \{[\s\S]*?async function submitOngoingExam\(\)/;
const timerNew = `function startOngoingExamTimer(seconds) {
    clearInterval(ongoingExamTimerInterval);
    const display = document.getElementById('examTimerDisplay');
    
    display.style.color = '';
    display.parentElement.style.borderColor = '';
    display.parentElement.style.animation = '';
    
    ongoingExamTimerInterval = setInterval(() => {
        seconds--;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        display.innerText = \`\${m}:\${s}\`;
        
        if (seconds <= 60) {
            display.style.color = '#ff4444';
            display.parentElement.style.borderColor = '#ff4444';
            display.parentElement.style.animation = 'pulseError 1s infinite';
        }
        
        if (seconds <= 0) {
            clearInterval(ongoingExamTimerInterval);
            if (ongoingExamPhase === 1) {
                alert("Time Over! Moving to Descriptive Section.");
                submitPhase1();
            } else {
                alert("Time Over, Submit");
                submitOngoingExam();
            }
        }
    }, 1000);
}

async function submitOngoingExam()`;

code = code.replace(timerRegex, timerNew);

// 5. submitOngoingExam payload
const payloadRegex = /body: JSON\.stringify\(\{\s*email: currentApplicant\.email,\s*answers: ongoingExamAnswers\s*\}\)/;
const payloadNew = `body: JSON.stringify({
                email: currentApplicant.email,
                name: (currentApplicant.firstName || '') + ' ' + (currentApplicant.lastName || ''),
                hq: currentApplicant.hq || 'Not Specified',
                division: currentApplicant.division || 'Not Specified',
                examDate: new Date().toISOString().split('T')[0],
                totalQuestions: ongoingExamQuestions.length,
                answers: ongoingExamAnswers
            })`;
code = code.replace(payloadRegex, payloadNew);

fs.writeFileSync('script.js', code);
console.log('script.js fully patched using regex blocks!');
