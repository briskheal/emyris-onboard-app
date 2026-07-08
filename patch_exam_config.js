const fs = require('fs');

// 1. db.js
let dbJs = fs.readFileSync('db.js', 'utf8');
if (!dbJs.includes('examMcqTime')) {
    dbJs = dbJs.replace(
        /activeExamProduct:\s*\{\s*type:\s*DataTypes\.STRING,\s*defaultValue:\s*""\s*\}/,
        `activeExamProduct: { type: DataTypes.STRING, defaultValue: "" },
    examMcqTime: { type: DataTypes.INTEGER, defaultValue: 15 },
    examDescriptiveTime: { type: DataTypes.INTEGER, defaultValue: 15 },
    examMcqCount: { type: DataTypes.INTEGER, defaultValue: 10 }`
    );
    fs.writeFileSync('db.js', dbJs);
    console.log('Patched db.js');
}

// 2. server.js
let serverJs = fs.readFileSync('server.js', 'utf8');

// Patch /api/admin/schedule-exam
const regexSchedule = /app\.post\('\/api\/admin\/schedule-exam', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Failed to schedule exam' \}\);\s*\}\s*\}\);/;
const newSchedule = `app.post('/api/admin/schedule-exam', async (req, res) => {
    try {
        const { date, product, mcqTime, descTime, mcqCount } = req.body;
        const company = await Company.findOne();
        if (company) {
            await Company.updateOne({ _id: company._id }, { 
                $set: { 
                    activeExamDate: date, 
                    activeExamProduct: product || '',
                    examMcqTime: mcqTime || 15,
                    examDescriptiveTime: descTime || 15,
                    examMcqCount: mcqCount || 10
                } 
            });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (e) {
        console.error('Schedule Exam Error:', e);
        res.status(500).json({ error: 'Failed to schedule exam' });
    }
});`;

if (regexSchedule.test(serverJs)) {
    serverJs = serverJs.replace(regexSchedule, newSchedule);
} else {
    console.log("Failed to match schedule API in server.js");
}

// Patch /api/applicant/exam-questions
const regexExam = /app\.post\('\/api\/applicant\/exam-questions', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, questions: safeQuestions \}\);\s*\} catch \(e\) \{/;
const newExam = `app.post('/api/applicant/exam-questions', async (req, res) => {
    try {
        const company = await Company.findOne();
        const activeProduct = company && company.activeExamProduct ? company.activeExamProduct : '';
        const mcqTime = company && company.examMcqTime ? company.examMcqTime : 15;
        const descTime = company && company.examDescriptiveTime ? company.examDescriptiveTime : 15;
        const mcqCount = company && company.examMcqCount ? company.examMcqCount : 10;
        
        const questions = await Question.find({ active: true });
        
        // ONLY fetch Product questions
        let allProductQs = questions.filter(q => 
            q.category === 'exam_product' || 
            (activeProduct && q.targetProduct === activeProduct) || 
            (activeProduct && q.category.toLowerCase() === activeProduct.toLowerCase()) ||
            q.category.toLowerCase() === 'emystein' // Fallback for legacy DB structure
        );
        
        // Strict slice for MCQ based on mcqCount, NO slice for Descriptive
        let mcqProductQs = allProductQs.filter(q => q.questionType === 'mcq').sort(() => 0.5 - Math.random()).slice(0, mcqCount);
        let descProductQs = allProductQs.filter(q => q.questionType === 'descriptive');
        
        // Combine and shuffle
        const selected = [...mcqProductQs, ...descProductQs].sort(() => 0.5 - Math.random());
        
        const safeQuestions = selected.map(q => ({
            _id: q._id,
            category: q.category,
            questionType: q.questionType,
            text: q.text,
            options: q.options,
            inputFields: q.inputFields,
            correctAnswerIndex: q.correctAnswerIndex
        }));
        
        res.json({ success: true, mcqTime, descTime, questions: safeQuestions });
    } catch (e) {`;

if (regexExam.test(serverJs)) {
    serverJs = serverJs.replace(regexExam, newExam);
} else {
    console.log("Failed to match exam-questions API in server.js");
}

fs.writeFileSync('server.js', serverJs);
console.log('Patched server.js');

// 3. admin.html
let adminHtml = fs.readFileSync('admin.html', 'utf8');
const oldHtmlBlock = `<div class="form-group">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Active Exam Date:</label>
                                    <input type="date" id="activeExamDateInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                </div>
                                <div class="form-group">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Target Product:</label>
                                    <select id="activeExamProductInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                        <option value="General">General / All</option>
                                    </select>
                                    <button class="btn btn-primary btn-sm" onclick="saveExamSchedule()">Save Schedule</button>
                                    <button class="btn btn-outline btn-sm" onclick="launchAdminTestSimulator()" style="border-color: #ef4444; color: #ef4444; font-weight: 700; background: rgba(239,68,68,0.1); margin-left: 10px;">🔴 Launch Rapid Test Preview</button>
                                </div>`;

const newHtmlBlock = `<div class="form-group">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Active Exam Date:</label>
                                    <input type="date" id="activeExamDateInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                </div>
                                <div class="form-group">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Target Product:</label>
                                    <select id="activeExamProductInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                        <option value="General">General / All</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">MCQ Mins:</label>
                                    <input type="number" id="examMcqTimeInput" value="15" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 80px;">
                                </div>
                                <div class="form-group">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Desc Mins:</label>
                                    <input type="number" id="examDescTimeInput" value="15" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 80px;">
                                </div>
                                <div class="form-group">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">MCQ Count:</label>
                                    <input type="number" id="examMcqCountInput" value="10" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 80px;">
                                </div>
                                <div class="form-group">
                                    <button class="btn btn-primary btn-sm" onclick="saveExamSchedule()" style="margin-top: 22px;">Save Schedule</button>
                                    <button class="btn btn-outline btn-sm" onclick="launchAdminTestSimulator()" style="border-color: #ef4444; color: #ef4444; font-weight: 700; background: rgba(239,68,68,0.1); margin-top: 22px; margin-left: 10px;">🔴 Launch Rapid Test Preview</button>
                                </div>`;
                                
if (adminHtml.includes('<select id="activeExamProductInput"')) {
    adminHtml = adminHtml.replace(
        /<div class="form-group">[\s\S]*?<label[\s\S]*?Active Exam Date:[\s\S]*?<\/div>[\s\S]*?<div class="form-group">[\s\S]*?<label[\s\S]*?Target Product:[\s\S]*?<\/button>[\s\S]*?<\/div>/,
        newHtmlBlock
    );
    fs.writeFileSync('admin.html', adminHtml);
    console.log('Patched admin.html');
}

// 4. admin-script.js
let adminScriptJs = fs.readFileSync('admin-script.js', 'utf8');

// Patch populateDropdowns or applyCompanyData to prefill inputs
const oldPrefill = `if (companyData.activeExamDate) {
        document.getElementById('activeExamDateInput').value = companyData.activeExamDate;
    }`;
const newPrefill = `if (companyData.activeExamDate) {
        document.getElementById('activeExamDateInput').value = companyData.activeExamDate;
    }
    if (document.getElementById('examMcqTimeInput')) {
        document.getElementById('examMcqTimeInput').value = companyData.examMcqTime || 15;
        document.getElementById('examDescTimeInput').value = companyData.examDescriptiveTime || 15;
        document.getElementById('examMcqCountInput').value = companyData.examMcqCount || 10;
    }`;
if (adminScriptJs.includes(oldPrefill)) {
    adminScriptJs = adminScriptJs.replace(oldPrefill, newPrefill);
}

const oldSaveSchedule = `async function saveExamSchedule() {
    const el = document.getElementById('activeExamDateInput');
    const prodEl = document.getElementById('activeExamProductInput');
    if (!el) return;
    const dateStr = el.value;
    const prodStr = prodEl ? prodEl.value : '';
    try {
        const res = await fetch('/api/admin/schedule-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, product: prodStr })
        });`;
        
const newSaveSchedule = `async function saveExamSchedule() {
    const el = document.getElementById('activeExamDateInput');
    const prodEl = document.getElementById('activeExamProductInput');
    const mcqTimeEl = document.getElementById('examMcqTimeInput');
    const descTimeEl = document.getElementById('examDescTimeInput');
    const mcqCountEl = document.getElementById('examMcqCountInput');
    
    if (!el) return;
    const dateStr = el.value;
    const prodStr = prodEl ? prodEl.value : '';
    const mcqTime = mcqTimeEl ? parseInt(mcqTimeEl.value) : 15;
    const descTime = descTimeEl ? parseInt(descTimeEl.value) : 15;
    const mcqCount = mcqCountEl ? parseInt(mcqCountEl.value) : 10;
    
    try {
        const res = await fetch('/api/admin/schedule-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, product: prodStr, mcqTime, descTime, mcqCount })
        });`;
if (adminScriptJs.includes(oldSaveSchedule)) {
    adminScriptJs = adminScriptJs.replace(oldSaveSchedule, newSaveSchedule);
} else {
    // try regex for saveSchedule
    adminScriptJs = adminScriptJs.replace(/async function saveExamSchedule\(\) \{[\s\S]*?body: JSON\.stringify\(\{ date: dateStr, product: prodStr \}\)\s*\}\);/, newSaveSchedule);
}
fs.writeFileSync('admin-script.js', adminScriptJs);
console.log('Patched admin-script.js');

// 5. script.js
let scriptJs = fs.readFileSync('script.js', 'utf8');

const regexScriptStart = /async function startOngoingExam\(\) \{[\s\S]*?ongoingExamPhase = 1;\s*renderOngoingExamQuestions\(\);[\s\S]*?startOngoingExamTimer\(15 \* 60\);[\s\S]*?function submitPhase1\(\) \{/;
const newScriptStart = `let ongoingExamMcqTime = 15;
let ongoingExamDescTime = 15;

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
            ongoingExamAnswers = {};
            ongoingExamPhase = 1;
            
            ongoingExamMcqTime = data.mcqTime || 15;
            ongoingExamDescTime = data.descTime || 15;
            
            renderOngoingExamQuestions();
            
            document.getElementById('examIntroSection').classList.add('hidden');
            document.getElementById('examQuestionsContainer').classList.remove('hidden');
            
            const submitBtn = document.getElementById('submitExamBtn');
            submitBtn.classList.remove('hidden');
            submitBtn.innerText = 'Submit MCQ & Continue';
            submitBtn.removeAttribute('onclick');
            submitBtn.onclick = submitPhase1;
            
            document.getElementById('floatingExamTimer').style.display = 'flex';
            startOngoingExamTimer(ongoingExamMcqTime * 60); 
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

function submitPhase1() {`;
if (regexScriptStart.test(scriptJs)) {
    scriptJs = scriptJs.replace(regexScriptStart, newScriptStart);
} else {
    console.log("Failed to match startOngoingExam in script.js");
}

const regexSubmit1 = /function submitPhase1\(\) \{[\s\S]*?startOngoingExamTimer\(15 \* 60\); \/\/ Reset timer for 15 mins/;
const newSubmit1 = `function submitPhase1() {
    ongoingExamPhase = 2;
    renderOngoingExamQuestions();
    
    const submitBtn = document.getElementById('submitExamBtn');
    submitBtn.innerText = 'Submit Final Exam';
    submitBtn.onclick = submitOngoingExam;
    
    startOngoingExamTimer(ongoingExamDescTime * 60); // Use custom descriptive time`;
if (regexSubmit1.test(scriptJs)) {
    scriptJs = scriptJs.replace(regexSubmit1, newSubmit1);
} else {
    console.log("Failed to match submitPhase1 in script.js");
}

fs.writeFileSync('script.js', scriptJs);
console.log('Patched script.js');
