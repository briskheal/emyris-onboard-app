const fs = require('fs');

// 1. Patch index.html
let html = fs.readFileSync('index.html', 'utf8');

const sidebarMenuStr = `<ul class="sidebar-menu">
            <li class="sidebar-item" onclick="updateView('applicantDashboard')">
                <span class="icon">🏠</span>
                <span class="text">Dashboard</span>
            </li>
            <li class="sidebar-item" onclick="updateView('applicantProfileView')">
                <span class="icon">👤</span>
                <span class="text">My Profile</span>
            </li>
            <li class="sidebar-item" onclick="updateView('applicantLettersView')">
                <span class="icon">✉️</span>
                <span class="text">My Letters</span>
            </li>
        </ul>`;
const newSidebarMenuStr = `<ul class="sidebar-menu">
            <li class="sidebar-item" onclick="updateView('applicantDashboard')">
                <span class="icon">🏠</span>
                <span class="text">Dashboard</span>
            </li>
            <li class="sidebar-item" onclick="updateView('applicantProfileView')">
                <span class="icon">👤</span>
                <span class="text">My Profile</span>
            </li>
            <li class="sidebar-item" onclick="updateView('applicantLettersView')">
                <span class="icon">✉️</span>
                <span class="text">My Letters</span>
            </li>
            <li class="sidebar-item" onclick="updateView('applicantScoreboardView'); fetchMyExamScores();">
                <span class="icon">🏆</span>
                <span class="text">My Exam Scores</span>
            </li>
        </ul>`;

if (html.includes(sidebarMenuStr)) {
    html = html.replace(sidebarMenuStr, newSidebarMenuStr);
}

const mainContentStr = `<!-- PROFILE VIEW -->`;
const newMainContentStr = `<!-- SCOREBOARD VIEW -->
        <div id="applicantScoreboardView" class="main-content hidden">
            <div class="glass-panel" style="animation: slideUp 0.6s ease-out backwards;">
                <h2 style="font-size: 1.8rem; margin-bottom: 5px; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🏆 My Exam Scoreboard</h2>
                <p style="color: var(--text-muted); margin-bottom: 25px;">Track your past assessments and manual grading results.</p>
                
                <div id="scoreboardContainer">
                    <div style="text-align: center; color: var(--text-muted);">Loading your scores...</div>
                </div>
            </div>
        </div>

        <!-- PROFILE VIEW -->`;

if (html.includes(mainContentStr)) {
    html = html.replace(mainContentStr, newMainContentStr);
}

// Add Review Modal
const reviewModalStr = `<!-- Review Exam Modal -->
    <div id="reviewExamModal" class="modal-backdrop hidden">
        <div class="modal" style="max-width: 650px; max-height: 90vh; display: flex; flex-direction: column;">
            <div class="modal-header">
                <h3>🔍 Review Exam: <span id="reviewExamProduct"></span></h3>
                <span class="modal-close" onclick="closeReviewModal()">×</span>
            </div>
            <div class="modal-body" style="flex: 1; overflow-y: auto;">
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <div style="flex: 1; background: rgba(99,102,241,0.1); padding: 10px; border-radius: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">MCQ Score</span><br>
                        <strong id="reviewMcqScore" style="font-size: 1.1rem; color: #6366f1;"></strong>
                    </div>
                    <div style="flex: 1; background: rgba(34,197,94,0.1); padding: 10px; border-radius: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Descriptive Score</span><br>
                        <strong id="reviewDescScore" style="font-size: 1.1rem; color: #4ade80;"></strong>
                    </div>
                </div>
                
                <div id="reviewExamAnswersList" style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Injected reviews -->
                </div>
            </div>
            <div class="modal-footer" style="padding-top: 15px; margin-top: 15px; border-top: 1px solid var(--glass-border); text-align: right;">
                <button class="btn btn-outline" onclick="closeReviewModal()">Close</button>
            </div>
        </div>
    </div>`;

if (!html.includes('reviewExamModal')) {
    html = html.replace('</body>', reviewModalStr + '\n</body>');
}
fs.writeFileSync('index.html', html);
console.log('Patched index.html');


// 2. Patch script.js
let js = fs.readFileSync('script.js', 'utf8');

const jsAdditions = `
// --- APPLICANT SCOREBOARD & REVIEW LOGIC ---
let myScoresData = [];
let myScoresQuestions = [];

async function fetchMyExamScores() {
    if (!currentApplicant || !currentApplicant.email) return;
    
    try {
        const res = await fetch(\`/api/applicant/my-scores/\${currentApplicant.email}\`);
        const data = await res.json();
        
        if (data.success) {
            myScoresData = data.exams;
            myScoresQuestions = data.questions;
            renderScoreboard();
        }
    } catch (e) {
        console.error("Error fetching scores:", e);
    }
}

function renderScoreboard() {
    const container = document.getElementById('scoreboardContainer');
    if (!container) return;
    
    if (myScoresData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px dashed var(--glass-border);">No past exams found.</div>';
        return;
    }
    
    // Group by Year/Month
    const groups = {};
    myScoresData.forEach(exam => {
        const d = new Date(exam.submittedAt);
        const yyyyMm = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[yyyyMm]) groups[yyyyMm] = [];
        groups[yyyyMm].push(exam);
    });
    
    let html = '';
    
    for (const [monthGroup, exams] of Object.entries(groups)) {
        html += \`<div style="margin-bottom: 30px;">
            <h3 style="font-size: 1.2rem; color: var(--text-main); margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid var(--glass-border);">🗓️ \${monthGroup}</h3>
            <div style="display: grid; gap: 15px;">\`;
            
        exams.forEach(exam => {
            const dStr = new Date(exam.submittedAt).toLocaleDateString();
            const isGraded = exam.status === 'graded';
            
            let scoreBlock = '';
            if (isGraded) {
                scoreBlock = \`<div style="display: flex; gap: 20px; align-items: center;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">MCQ</div>
                        <div style="font-weight: 700;">\${exam.autoScore}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Desc</div>
                        <div style="font-weight: 700;">\${exam.manualScore}</div>
                    </div>
                    <div style="text-align: center; padding: 5px 15px; background: rgba(99,102,241,0.15); border-radius: 20px; border: 1px solid rgba(99,102,241,0.3);">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Total</div>
                        <div style="font-weight: 800; color: #818cf8;">\${exam.totalScore} / \${exam.totalQuestions}</div>
                    </div>
                </div>\`;
            } else {
                scoreBlock = \`<span style="padding: 4px 10px; background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.3); color: #facc15; border-radius: 12px; font-size: 0.8rem;">Pending Review</span>\`;
            }
            
            html += \`
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s;"
                     onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='var(--primary)'"
                     onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='var(--glass-border)'">
                    
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: white; margin-bottom: 4px;">\${exam.testedProduct || 'General'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Submitted: \${dStr}</div>
                    </div>
                    
                    \${scoreBlock}
                    
                    <button class="btn btn-outline btn-sm" style="margin-left: 20px;" onclick="openReviewModal('\${exam._id}')">View Details</button>
                </div>
            \`;
        });
        
        html += \`</div></div>\`;
    }
    
    container.innerHTML = html;
}

function openReviewModal(examId) {
    const exam = myScoresData.find(e => e._id === examId);
    if (!exam) return;
    
    document.getElementById('reviewExamProduct').innerText = exam.testedProduct || 'General';
    document.getElementById('reviewMcqScore').innerText = exam.autoScore;
    document.getElementById('reviewDescScore').innerText = exam.status === 'graded' ? exam.manualScore : 'Pending';
    
    const list = document.getElementById('reviewExamAnswersList');
    list.innerHTML = '';
    
    // Display all answers (MCQ and Desc)
    for (const [qId, ans] of Object.entries(exam.answers || {})) {
        const q = myScoresQuestions.find(qu => qu._id === qId);
        if (q) {
            const wrap = document.createElement('div');
            wrap.style.background = 'rgba(0,0,0,0.2)';
            wrap.style.padding = '15px';
            wrap.style.borderRadius = '8px';
            wrap.style.border = '1px solid var(--glass-border)';
            
            let isCorrectHtml = '';
            let ansText = '';
            
            if (q.questionType === 'mcq') {
                const isCorrect = Number(ans) === q.correctAnswerIndex;
                isCorrectHtml = isCorrect 
                    ? '<span style="color: #4ade80; font-size: 0.8rem; font-weight: bold; margin-left: 10px;">[CORRECT]</span>'
                    : '<span style="color: #f87171; font-size: 0.8rem; font-weight: bold; margin-left: 10px;">[INCORRECT]</span>';
                
                ansText = q.options[Number(ans)] || 'Unknown';
            } else {
                isCorrectHtml = '<span style="color: #60a5fa; font-size: 0.8rem; font-weight: bold; margin-left: 10px;">[DESCRIPTIVE]</span>';
                if (typeof ans === 'object') {
                    ansText = Object.entries(ans).map(([k, v]) => \`<strong>\${k}:</strong> \${v}\`).join('<br>');
                } else {
                    ansText = ans;
                }
            }
            
            wrap.innerHTML = \`
                <div style="font-size: 0.95rem; color: var(--text-main); margin-bottom: 10px;">
                    <strong>Q: \${q.text}</strong> \${isCorrectHtml}
                </div>
                <div style="font-size: 0.9rem; color: #e2e8f0; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; border-left: 3px solid #6366f1;">
                    \${ansText || '<em>No answer provided</em>'}
                </div>
            \`;
            list.appendChild(wrap);
        }
    }
    
    document.getElementById('reviewExamModal').classList.remove('hidden');
}

function closeReviewModal() {
    document.getElementById('reviewExamModal').classList.add('hidden');
}
`;

if (!js.includes('function fetchMyExamScores()')) {
    fs.writeFileSync('script.js', js + '\n\n' + jsAdditions);
    console.log("Patched script.js");
}
