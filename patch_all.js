const fs = require('fs');

// --- 1. Patch server.js ---
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldSubmitBlock = `app.post('/api/applicant/submit-exam', async (req, res) => {
    try {
        const { email, name, hq, division, examDate, answers, totalQuestions } = req.body;
        
        let autoScore = 0;
        const questions = await Question.find({ active: true });
        
        for (const [qId, selectedIdxOrText] of Object.entries(answers || {})) {
            const q = questions.find(qu => qu._id === qId);
            if (q && q.questionType === 'mcq' && q.correctAnswerIndex === Number(selectedIdxOrText)) {
                autoScore++;
            }
        }
        
        await ExamResult.create({
            email,
            name,
            hq,
            division,
            examDate,
            totalQuestions,
            autoScore,
            manualScore: 0,
            totalScore: autoScore,
            status: 'pending_review',
            answers
        });
        
        res.json({ success: true });
    } catch (e) {
        console.error('Submit Exam Error:', e);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});`;

const newSubmitBlock = `app.post('/api/applicant/submit-exam', async (req, res) => {
    try {
        const { email, answers } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email' });

        const applicant = await Applicant.findOne({ email });
        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        const name = applicant.fullName || email.split('@')[0];
        const hq = applicant.hq || (applicant.formData ? applicant.formData.hq : 'Unknown');
        const division = applicant.division || 'Unknown';
        const examDate = new Date().toISOString().split('T')[0];
        const totalQuestions = Object.keys(answers || {}).length;
        
        let autoScore = 0;
        const questions = await Question.find({ active: true });
        
        for (const [qId, selectedIdxOrText] of Object.entries(answers || {})) {
            const q = questions.find(qu => qu._id === qId);
            if (q && q.questionType === 'mcq' && q.correctAnswerIndex === Number(selectedIdxOrText)) {
                autoScore++;
            }
        }
        
        await ExamResult.create({
            email,
            name,
            hq,
            division,
            examDate,
            totalQuestions,
            autoScore,
            manualScore: 0,
            totalScore: autoScore,
            status: 'pending_review',
            answers: answers || {}
        });
        
        res.json({ success: true });
    } catch (e) {
        console.error('Submit Exam Error:', e);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});`;

serverJs = serverJs.replace(oldSubmitBlock, newSubmitBlock);
fs.writeFileSync('server.js', serverJs);
console.log('Patched server.js');


// --- 2. Patch script.js ---
let scriptJs = fs.readFileSync('script.js', 'utf8');

const regexScript = /async function startOngoingExam\(\) \{[\s\S]*?async function submitOngoingExam\(\) \{[\s\S]*?\}\n\}/;

const newScriptBlock = `let examPhase = 1;
let mcqQuestions = [];
let descQuestions = [];

async function startOngoingExam() {
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
            mcqQuestions = data.questions.filter(q => q.questionType === 'mcq');
            descQuestions = data.questions.filter(q => q.questionType === 'descriptive');
            
            ongoingExamAnswers = {};
            examPhase = 1;
            
            document.getElementById('examIntroSection').classList.add('hidden');
            document.getElementById('examQuestionsContainer').classList.remove('hidden');
            document.getElementById('submitExamBtn').classList.remove('hidden');
            
            renderPhaseQuestions();
            
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

function renderPhaseQuestions() {
    const list = document.getElementById('examQuestionsList');
    list.innerHTML = '';
    
    let currentQuestions = examPhase === 1 ? mcqQuestions : descQuestions;
    
    const titleEl = document.getElementById('examPhaseTitle');
    if (titleEl) {
        titleEl.innerText = examPhase === 1 ? '📝 Phase 1: Multiple Choice (Product Knowledge)' : '📝 Phase 2: Descriptive (Market Intelligence)';
    }
    document.getElementById('submitExamBtn').innerText = examPhase === 1 ? 'Submit Part 1 & Proceed to Part 2' : 'Submit Final Assessment';
    
    currentQuestions.forEach((q, idx) => {
        const qContainer = document.createElement('div');
        qContainer.style.background = 'rgba(255,255,255,0.02)';
        qContainer.style.border = '1px solid var(--glass-border)';
        qContainer.style.borderRadius = '12px';
        qContainer.style.padding = '1.5rem';
        qContainer.style.marginBottom = '1.5rem';
        
        let qTypeLabel = q.questionType === 'descriptive' ? '<span style="color:#818cf8; font-size:0.75rem; font-weight:bold; margin-right:8px;">[DESCRIPTIVE]</span>' : '';
        
        let html = \`
            <h4 style="margin-top:0; color:var(--text-main); font-size:1.1rem; line-height:1.4;">
                <span style="color:var(--primary); font-weight:800; margin-right:8px;">Q\${idx+1}.</span>
                \${qTypeLabel}
                \${q.text}
            </h4>
        \`;
        
        if (q.questionType === 'descriptive') {
            const inputsContainer = document.createElement('div');
            inputsContainer.style.display = 'flex';
            inputsContainer.style.flexDirection = 'column';
            inputsContainer.style.gap = '10px';
            inputsContainer.style.marginTop = '15px';
            
            if (q.inputFields && q.inputFields.length > 0) {
                q.inputFields.forEach(label => {
                    const wrap = document.createElement('div');
                    const lbl = document.createElement('label');
                    lbl.innerText = label;
                    lbl.style.display = 'block';
                    lbl.style.fontSize = '0.85rem';
                    lbl.style.color = 'var(--text-muted)';
                    lbl.style.marginBottom = '4px';
                    
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.className = 'form-input';
                    inp.style.width = '100%';
                    inp.oninput = (e) => saveOngoingAnswer(q._id, label, e.target.value);
                    
                    wrap.appendChild(lbl);
                    wrap.appendChild(inp);
                    inputsContainer.appendChild(wrap);
                });
            } else {
                const txa = document.createElement('textarea');
                txa.className = 'form-input';
                txa.style.width = '100%';
                txa.rows = 4;
                txa.oninput = (e) => saveOngoingAnswer(q._id, 'default', e.target.value);
                inputsContainer.appendChild(txa);
            }
            
            qContainer.innerHTML = html;
            qContainer.appendChild(inputsContainer);
        } else {
            let optsHtml = \`<div id="examOpts_\${q._id}" style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">\`;
            (q.options || []).forEach((opt, oIdx) => {
                optsHtml += \`
                    <label id="examOptLbl_\${q._id}_\${oIdx}" style="display:flex; align-items:center; gap:10px; padding:12px 16px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; cursor:pointer; transition:all 0.2s;"
                           onmouseenter="this.style.background='rgba(99,102,241,0.1)'"
                           onmouseleave="if(!this.querySelector('input').checked) this.style.background='rgba(0,0,0,0.2)'">
                        <input type="radio" name="exam_q_\${q._id}" value="\${oIdx}" onclick="selectOngoingMcqAnswer('\${q._id}', \${oIdx}, \${q.correctAnswerIndex})">
                        <span>\${opt}</span>
                    </label>
                \`;
            });
            optsHtml += \`</div>\`;
            qContainer.innerHTML = html + optsHtml;
        }
        
        list.appendChild(qContainer);
    });
}

function handlePhaseSubmission() {
    if (examPhase === 1) {
        examPhase = 2;
        renderPhaseQuestions();
        startOngoingExamTimer(15 * 60); // Reset for phase 2
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        submitOngoingExam();
    }
}

function selectOngoingMcqAnswer(qId, selectedIdx, correctIdx) {
    saveOngoingAnswer(qId, 'mcq', selectedIdx);
    const container = document.getElementById(\`examOpts_\${qId}\`);
    if (!container) return;
    container.style.pointerEvents = 'none';
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(r => r.disabled = true);
    const labels = container.querySelectorAll('label');
    labels.forEach((lbl, idx) => {
        if (idx === correctIdx) {
            lbl.style.background = 'rgba(34, 197, 94, 0.15)';
            lbl.style.borderColor = 'rgba(34, 197, 94, 0.6)';
            lbl.style.color = '#4ade80';
        } else if (idx === selectedIdx && selectedIdx !== correctIdx) {
            lbl.style.background = 'rgba(239, 68, 68, 0.15)';
            lbl.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            lbl.style.color = '#f87171';
        } else {
            lbl.style.opacity = '0.5';
        }
    });
}

function saveOngoingAnswer(qId, key, value) {
    if (!ongoingExamAnswers[qId]) {
        if (key === 'mcq' || key === 'default') {
            ongoingExamAnswers[qId] = value;
        } else {
            ongoingExamAnswers[qId] = { [key]: value };
        }
    } else {
        if (key === 'mcq' || key === 'default') {
            ongoingExamAnswers[qId] = value;
        } else {
            ongoingExamAnswers[qId][key] = value;
        }
    }
}

function startOngoingExamTimer(seconds) {
    clearInterval(ongoingExamTimerInterval);
    const display = document.getElementById('examTimerDisplay');
    display.style.color = '#fff';
    display.parentElement.style.borderColor = 'rgba(255,255,255,0.1)';
    display.parentElement.style.animation = 'none';
    
    ongoingExamTimerInterval = setInterval(() => {
        seconds--;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        display.innerText = \`\${m}:\${s}\`;
        
        if (seconds <= 60 && seconds > 0) {
            display.style.color = '#ff4444';
            display.parentElement.style.borderColor = '#ff4444';
            display.parentElement.style.animation = 'pulseError 1s infinite';
        }
        
        if (seconds <= 0) {
            clearInterval(ongoingExamTimerInterval);
            alert('Time Over, Submit');
            handlePhaseSubmission();
        }
    }, 1000);
}

async function submitOngoingExam() {
    clearInterval(ongoingExamTimerInterval);
    lockUI('⏳ Submitting your exam...');
    try {
        const res = await fetch('/api/applicant/submit-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentApplicant.email,
                answers: ongoingExamAnswers
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('Your exam has been submitted successfully.');
            renderApplicantDashboard();
            updateView('applicantDashboard');
            document.getElementById('floatingExamTimer').style.display = 'none';
            document.getElementById('applicantExamBtn').classList.add('hidden');
        } else {
            alert(data.message || 'Failed to submit exam.');
        }
    } catch (e) {
        console.error(e);
        alert('Error submitting exam.');
    } finally {
        unlockUI();
    }
}`;

scriptJs = scriptJs.replace(regexScript, newScriptBlock);
fs.writeFileSync('script.js', scriptJs);
console.log('Patched script.js');

// --- 3. Patch index.html ---
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
    '<h2 style="color: var(--primary-light); margin: 0;">📝 Scheduled Assessment</h2>',
    '<h2 id="examPhaseTitle" style="color: var(--primary-light); margin: 0;">📝 Scheduled Assessment</h2>'
);
indexHtml = indexHtml.replace(
    'onclick="submitOngoingExam()">Submit Assessment</button>',
    'onclick="handlePhaseSubmission()">Submit Assessment</button>'
);
fs.writeFileSync('index.html', indexHtml);
console.log('Patched index.html');
