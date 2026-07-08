const fs = require('fs');

// --- 1. Patch db.js ---
let dbJs = fs.readFileSync('db.js', 'utf8');

if (!dbJs.includes('activeExamProduct:')) {
    dbJs = dbJs.replace('activeExamDate: { type: DataTypes.STRING, defaultValue: "" },',
        'activeExamDate: { type: DataTypes.STRING, defaultValue: "" },\n    activeExamProduct: { type: DataTypes.STRING, defaultValue: "" },');
}
if (!dbJs.includes('targetProduct:')) {
    dbJs = dbJs.replace('category: { type: DataTypes.STRING, allowNull: false },',
        'category: { type: DataTypes.STRING, allowNull: false },\n    targetProduct: { type: DataTypes.STRING, defaultValue: "General" },');
}
if (!dbJs.includes('testedProduct:')) {
    dbJs = dbJs.replace('examDate: { type: DataTypes.STRING, allowNull: false },',
        'examDate: { type: DataTypes.STRING, allowNull: false },\n    testedProduct: { type: DataTypes.STRING, defaultValue: "" },');
}

fs.writeFileSync('db.js', dbJs);
console.log('Patched db.js');

// --- 2. Patch server.js ---
let serverJs = fs.readFileSync('server.js', 'utf8');

// /api/admin/schedule-exam
const oldSchedule = `const { date } = req.body;
        const company = await Company.findOne();
        if (company) {
            await Company.updateOne({ _id: company._id }, { $set: { activeExamDate: date } });`;
const newSchedule = `const { date, product } = req.body;
        const company = await Company.findOne();
        if (company) {
            await Company.updateOne({ _id: company._id }, { $set: { activeExamDate: date, activeExamProduct: product || 'General' } });`;
if(serverJs.includes(oldSchedule)) serverJs = serverJs.replace(oldSchedule, newSchedule);

// /api/admin/questions POST
const oldPostQ = `app.post('/api/admin/questions', async (req, res) => {
    try {
        const { id, category, questionType, text, options, inputFields, correctAnswerIndex, active } = req.body;`;
const newPostQ = `app.post('/api/admin/questions', async (req, res) => {
    try {
        const { id, category, targetProduct, questionType, text, options, inputFields, correctAnswerIndex, active } = req.body;`;
if(serverJs.includes(oldPostQ)) serverJs = serverJs.replace(oldPostQ, newPostQ);

const oldUpdateQ = `await Question.updateOne({ _id: id }, { $set: { category, questionType, text, options, inputFields, correctAnswerIndex, active } });`;
const newUpdateQ = `await Question.updateOne({ _id: id }, { $set: { category, targetProduct, questionType, text, options, inputFields, correctAnswerIndex, active } });`;
if(serverJs.includes(oldUpdateQ)) serverJs = serverJs.replace(oldUpdateQ, newUpdateQ);

const oldCreateQ = `await Question.create({ category, questionType, text, options, inputFields, correctAnswerIndex, active });`;
const newCreateQ = `await Question.create({ category, targetProduct: targetProduct || 'General', questionType, text, options, inputFields, correctAnswerIndex, active });`;
if(serverJs.includes(oldCreateQ)) serverJs = serverJs.replace(oldCreateQ, newCreateQ);

// /api/applicant/exam-questions
const oldExamQs = `const questions = await Question.find({ active: true });`;
const newExamQs = `const company = await Company.findOne();
        let questions = await Question.find({ active: true });
        if (company && company.activeExamProduct && company.activeExamProduct !== 'General') {
            questions = questions.filter(q => q.targetProduct === company.activeExamProduct || q.category !== 'exam_product');
        }`;
if(serverJs.includes(oldExamQs)) serverJs = serverJs.replace(oldExamQs, newExamQs);

// /api/applicant/submit-exam
const oldSubmitQs = `const name = applicant.fullName || email.split('@')[0];
        const hq = applicant.hq || (applicant.formData ? applicant.formData.hq : 'Unknown');
        const division = applicant.division || 'Unknown';
        const examDate = new Date().toISOString().split('T')[0];
        const totalQuestions = Object.keys(answers || {}).length;`;
const newSubmitQs = `const name = applicant.fullName || email.split('@')[0];
        const hq = applicant.hq || (applicant.formData ? applicant.formData.hq : 'Unknown');
        const division = applicant.division || 'Unknown';
        const examDate = new Date().toISOString().split('T')[0];
        const totalQuestions = Object.keys(answers || {}).length;
        const company = await Company.findOne();`;
if(serverJs.includes(oldSubmitQs)) serverJs = serverJs.replace(oldSubmitQs, newSubmitQs);

const oldExamCreate = `await ExamResult.create({
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
        });`;
const newExamCreate = `await ExamResult.create({
            email,
            name,
            hq,
            division,
            examDate,
            testedProduct: company ? (company.activeExamProduct || 'General') : 'General',
            totalQuestions,
            autoScore,
            manualScore: 0,
            totalScore: autoScore,
            status: 'pending_review',
            answers: answers || {}
        });`;
if(serverJs.includes(oldExamCreate)) serverJs = serverJs.replace(oldExamCreate, newExamCreate);

fs.writeFileSync('server.js', serverJs);
console.log('Patched server.js');

// --- 3. Patch admin.html ---
let adminHtml = fs.readFileSync('admin.html', 'utf8');

const oldExamInputs = `<label style="font-size: 0.8rem; color: var(--text-muted);">Active Exam Date:</label>
                                    <input type="date" id="activeExamDateInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem;">
                                    <button class="btn btn-primary btn-sm" onclick="saveExamSchedule()">Save Date</button>`;
const newExamInputs = `<label style="font-size: 0.8rem; color: var(--text-muted);">Exam Date:</label>
                                    <input type="date" id="activeExamDateInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 130px;">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Target Product:</label>
                                    <select id="activeExamProductInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                        <option value="General">General / All</option>
                                        <option value="Emystein">Emystein</option>
                                        <option value="Briskheal">Briskheal</option>
                                    </select>
                                    <button class="btn btn-primary btn-sm" onclick="saveExamSchedule()">Schedule Exam</button>`;
if(adminHtml.includes(oldExamInputs)) adminHtml = adminHtml.replace(oldExamInputs, newExamInputs);

const oldQCategory = `<div class="form-group">
                    <label>Category</label>
                    <select id="q_category" required style="width: 100%;" class="form-input">`;
const newQCategory = `<div class="form-group" style="display:flex; gap: 10px;">
                    <div style="flex:1;">
                        <label>Category</label>
                        <select id="q_category" required style="width: 100%;" class="form-input">`;
if(adminHtml.includes(oldQCategory)) adminHtml = adminHtml.replace(oldQCategory, newQCategory);

const oldQCategoryEnd = `<option value="exam_current_affairs">Employee Exam - Current Affairs</option>
                    </select>
                </div>`;
const newQCategoryEnd = `<option value="exam_current_affairs">Employee Exam - Current Affairs</option>
                    </select>
                    </div>
                    <div style="flex:1;">
                        <label>Target Product</label>
                        <select id="q_targetProduct" style="width: 100%;" class="form-input">
                            <option value="General">General / Not Applicable</option>
                            <option value="Emystein">Emystein</option>
                            <option value="Briskheal">Briskheal</option>
                        </select>
                    </div>
                </div>`;
if(adminHtml.includes(oldQCategoryEnd)) adminHtml = adminHtml.replace(oldQCategoryEnd, newQCategoryEnd);

const oldTableHeader = `<th>Category</th>
                                            <th>Question</th>`;
const newTableHeader = `<th>Category</th>
                                            <th>Target Product</th>
                                            <th>Question</th>`;
if(adminHtml.includes(oldTableHeader)) adminHtml = adminHtml.replace(oldTableHeader, newTableHeader);

fs.writeFileSync('admin.html', adminHtml);
console.log('Patched admin.html');

// --- 4. Patch admin-script.js ---
let adminScript = fs.readFileSync('admin-script.js', 'utf8');

const oldSaveSchedule = `const dateStr = el.value;
    try {
        const res = await fetch('/api/admin/schedule-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr })
        });`;
const newSaveSchedule = `const dateStr = el.value;
    const prodEl = document.getElementById('activeExamProductInput');
    const productStr = prodEl ? prodEl.value : 'General';
    try {
        const res = await fetch('/api/admin/schedule-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, product: productStr })
        });`;
if(adminScript.includes(oldSaveSchedule)) adminScript = adminScript.replace(oldSaveSchedule, newSaveSchedule);

const oldEditQ = `document.getElementById('q_id').value = q._id;
    document.getElementById('q_category').value = q.category;
    document.getElementById('q_text').value = q.text;`;
const newEditQ = `document.getElementById('q_id').value = q._id;
    document.getElementById('q_category').value = q.category;
    if(document.getElementById('q_targetProduct')) document.getElementById('q_targetProduct').value = q.targetProduct || 'General';
    document.getElementById('q_text').value = q.text;`;
if(adminScript.includes(oldEditQ)) adminScript = adminScript.replace(oldEditQ, newEditQ);

const oldSubmitQ = `let payload = {
        category: document.getElementById('q_category').value,
        questionType: qType,
        text: document.getElementById('q_text').value,
        active: true
    };`;
const newSubmitQ = `let payload = {
        category: document.getElementById('q_category').value,
        targetProduct: document.getElementById('q_targetProduct') ? document.getElementById('q_targetProduct').value : 'General',
        questionType: qType,
        text: document.getElementById('q_text').value,
        active: true
    };`;
if(adminScript.includes(oldSubmitQ)) adminScript = adminScript.replace(oldSubmitQ, newSubmitQ);

const oldQRow = `<td><span class="status-badge" style="background:rgba(99,102,241,0.1); color:#818cf8;">\${q.category}</span></td>
                    <td>`;
const newQRow = `<td><span class="status-badge" style="background:rgba(99,102,241,0.1); color:#818cf8;">\${q.category}</span></td>
                    <td><span class="status-badge" style="background:rgba(34,197,94,0.1); color:#4ade80;">\${q.targetProduct || 'General'}</span></td>
                    <td>`;
if(adminScript.includes(oldQRow)) adminScript = adminScript.replace(oldQRow, newQRow);

fs.writeFileSync('admin-script.js', adminScript);
console.log('Patched admin-script.js');
