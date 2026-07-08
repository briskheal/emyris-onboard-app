const fs = require('fs');

// 1. Patch admin.html
let html = fs.readFileSync('admin.html', 'utf8');

// Add the Sidebar Tab
const sidebarTabStr = `<li class="sidebar-item" onclick="switchAdminTab('adminSettingsTab')">
                        <span class="icon">⚙️</span>
                        <span class="text">Setup & Letters</span>
                    </li>`;
const newSidebarTabStr = `<li class="sidebar-item" onclick="switchAdminTab('adminSettingsTab')">
                        <span class="icon">⚙️</span>
                        <span class="text">Setup & Letters</span>
                    </li>
                    <li class="sidebar-item" onclick="switchAdminTab('adminExamSubmissionsTab'); fetchPendingExams();">
                        <span class="icon">📝</span>
                        <span class="text">Exam Submissions</span>
                    </li>`;
if (html.includes(sidebarTabStr)) {
    html = html.replace(sidebarTabStr, newSidebarTabStr);
}

// Add the Tab Content
const tabContentStr = `<!-- Settings Tab -->`;
const newTabContentStr = `<!-- Exam Submissions Tab -->
                    <div id="adminExamSubmissionsTab" class="admin-tab-content hidden">
                        <div class="setup-section">
                            <div class="setup-section-head">
                                <h4>📝 Pending Exam Submissions</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Review and manually grade descriptive answers.</p>
                            </div>
                            <div class="table-responsive">
                                <table class="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Applicant Name</th>
                                            <th>Product</th>
                                            <th>Status</th>
                                            <th>Auto MCQ Score</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="examSubmissionsTableBody">
                                        <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Settings Tab -->`;
if (html.includes(tabContentStr)) {
    html = html.replace(tabContentStr, newTabContentStr);
}

// Add Grading Modal
const gradingModalStr = `<!-- Grading Modal -->
    <div id="gradingModal" class="modal-backdrop hidden">
        <div class="modal" style="max-width: 600px; max-height: 90vh; display: flex; flex-direction: column;">
            <div class="modal-header">
                <h3>📝 Grade Exam: <span id="gradingApplicantName"></span></h3>
                <span class="modal-close" onclick="closeGradingModal()">×</span>
            </div>
            <div class="modal-body" style="flex: 1; overflow-y: auto;">
                <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                    <div style="flex: 1; background: rgba(99,102,241,0.1); padding: 15px; border-radius: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Product</span><br>
                        <strong id="gradingProduct" style="font-size: 1.1rem;"></strong>
                    </div>
                    <div style="flex: 1; background: rgba(34,197,94,0.1); padding: 15px; border-radius: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">MCQ Auto-Score</span><br>
                        <strong id="gradingMcqScore" style="font-size: 1.1rem; color: #4ade80;"></strong>
                    </div>
                </div>
                <h4>Descriptive Answers</h4>
                <div id="gradingAnswersList" style="display: flex; flex-direction: column; gap: 15px; margin-top: 10px;">
                    <!-- Answers inject here -->
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 15px; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 15px; margin-top: 15px;">
                <label style="font-weight: 600;">Manual Score (Descriptive):</label>
                <input type="number" id="gradingManualScoreInput" class="form-input" style="width: 80px;" value="0">
                <div style="flex: 1;"></div>
                <button class="btn btn-outline" onclick="closeGradingModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitExamGrade()">Approve & Grade</button>
            </div>
        </div>
    </div>`;

if (!html.includes('gradingModal')) {
    html = html.replace('</body>', gradingModalStr + '\n</body>');
}
fs.writeFileSync('admin.html', html);
console.log("Patched admin.html");

// 2. Patch admin-script.js
let js = fs.readFileSync('admin-script.js', 'utf8');

const jsAdditions = `
// --- EXAM GRADING LOGIC ---
let pendingExamsData = [];
let allExamQuestions = [];
let currentGradingExamId = null;

async function fetchPendingExams() {
    try {
        const res = await fetch('/api/admin/pending-exams');
        const data = await res.json();
        if (data.success) {
            pendingExamsData = data.exams;
            allExamQuestions = data.questions;
            renderPendingExams();
        }
    } catch (e) {
        console.error(e);
        showToast('Error loading exams');
    }
}

function renderPendingExams() {
    const tbody = document.getElementById('examSubmissionsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (pendingExamsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No exams found.</td></tr>';
        return;
    }
    
    pendingExamsData.forEach(exam => {
        const tr = document.createElement('tr');
        const dStr = new Date(exam.submittedAt).toLocaleDateString();
        
        let statusBadge = '';
        if (exam.status === 'pending_review') {
            statusBadge = '<span class="status-badge bg-warning">Pending</span>';
        } else {
            statusBadge = '<span class="status-badge bg-success">Graded</span>';
        }
        
        let actionBtn = exam.status === 'pending_review' 
            ? \`<button class="btn btn-primary btn-sm" onclick="openGradingModal('\${exam._id}')">Grade</button>\`
            : \`<button class="btn btn-outline btn-sm" onclick="openGradingModal('\${exam._id}')">Review</button>\`;
            
        tr.innerHTML = \`
            <td>\${dStr}</td>
            <td><strong>\${exam.name || exam.email}</strong></td>
            <td>\${exam.testedProduct || 'General'}</td>
            <td>\${statusBadge}</td>
            <td>\${exam.autoScore} / \${exam.totalQuestions}</td>
            <td>\${actionBtn}</td>
        \`;
        tbody.appendChild(tr);
    });
}

function openGradingModal(examId) {
    currentGradingExamId = examId;
    const exam = pendingExamsData.find(e => e._id === examId);
    if (!exam) return;
    
    document.getElementById('gradingApplicantName').innerText = exam.name || exam.email;
    document.getElementById('gradingProduct').innerText = exam.testedProduct || 'General';
    document.getElementById('gradingMcqScore').innerText = exam.autoScore;
    
    const list = document.getElementById('gradingAnswersList');
    list.innerHTML = '';
    
    let hasDescriptive = false;
    
    // Find all descriptive answers
    for (const [qId, ans] of Object.entries(exam.answers || {})) {
        const q = allExamQuestions.find(qu => qu._id === qId);
        if (q && q.questionType === 'descriptive') {
            hasDescriptive = true;
            const wrap = document.createElement('div');
            wrap.style.background = 'rgba(0,0,0,0.2)';
            wrap.style.padding = '15px';
            wrap.style.borderRadius = '8px';
            wrap.style.border = '1px solid var(--glass-border)';
            
            let ansText = '';
            if (typeof ans === 'object') {
                ansText = Object.entries(ans).map(([k, v]) => \`<strong>\${k}:</strong> \${v}\`).join('<br>');
            } else {
                ansText = ans;
            }
            
            wrap.innerHTML = \`
                <div style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 8px;"><strong>Q: \${q.text}</strong></div>
                <div style="font-size: 0.9rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">\${ansText || '<em>No answer provided</em>'}</div>
            \`;
            list.appendChild(wrap);
        }
    }
    
    if (!hasDescriptive) {
        list.innerHTML = '<div style="color: var(--text-muted);">No descriptive answers found in this exam.</div>';
    }
    
    document.getElementById('gradingManualScoreInput').value = exam.manualScore || 0;
    document.getElementById('gradingModal').classList.remove('hidden');
}

function closeGradingModal() {
    document.getElementById('gradingModal').classList.add('hidden');
}

async function submitExamGrade() {
    if (!currentGradingExamId) return;
    const manualScore = document.getElementById('gradingManualScoreInput').value;
    
    try {
        const res = await fetch('/api/admin/grade-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examId: currentGradingExamId, manualScore })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Grade submitted & applicant emailed!');
            closeGradingModal();
            fetchPendingExams();
        } else {
            alert(data.error || 'Failed to submit grade');
        }
    } catch (e) {
        console.error(e);
        alert('Error submitting grade');
    }
}
`;

if (!js.includes('function fetchPendingExams()')) {
    fs.writeFileSync('admin-script.js', js + '\n\n' + jsAdditions);
    console.log("Patched admin-script.js");
}
