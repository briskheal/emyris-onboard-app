const fs = require('fs');

// --- 1. Fix admin.html ---
let adminHtml = fs.readFileSync('admin.html', 'utf8');

// Insert sidebar tab
if (!adminHtml.includes('adminExamSubmissionsTab')) {
    adminHtml = adminHtml.replace(
        /(<li class="sidebar-item" onclick="switchAdminTab\('adminSettingsTab'\)">[\s\S]*?<\/li>)/,
        `$1
                    <li class="sidebar-item" onclick="switchAdminTab('adminExamSubmissionsTab'); fetchPendingExams();">
                        <span class="icon">📝</span>
                        <span class="text">Exam Submissions</span>
                    </li>`
    );
}

// Insert view content
if (!adminHtml.includes('id="adminExamSubmissionsTab"')) {
    adminHtml = adminHtml.replace(
        /(<!-- Settings Tab -->)/,
        `<!-- Exam Submissions Tab -->
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

                    $1`
    );
}
fs.writeFileSync('admin.html', adminHtml);
console.log("Fixed admin.html tabs");


// --- 2. Fix index.html ---
let indexHtml = fs.readFileSync('index.html', 'utf8');

if (!indexHtml.includes('applicantScoreboardView')) {
    // Insert sidebar tab
    indexHtml = indexHtml.replace(
        /(<li class="sidebar-item" onclick="updateView\('applicantLettersView'\)">[\s\S]*?<\/li>)/,
        `$1
            <li class="sidebar-item" onclick="updateView('applicantScoreboardView'); fetchMyExamScores();">
                <span class="icon">🏆</span>
                <span class="text">My Exam Scores</span>
            </li>`
    );

    // Insert view content
    indexHtml = indexHtml.replace(
        /(<!-- PROFILE VIEW -->)/,
        `<!-- SCOREBOARD VIEW -->
        <div id="applicantScoreboardView" class="main-content hidden">
            <div class="glass-panel" style="animation: slideUp 0.6s ease-out backwards;">
                <h2 style="font-size: 1.8rem; margin-bottom: 5px; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🏆 My Exam Scoreboard</h2>
                <p style="color: var(--text-muted); margin-bottom: 25px;">Track your past assessments and manual grading results.</p>
                
                <div id="scoreboardContainer">
                    <div style="text-align: center; color: var(--text-muted);">Loading your scores...</div>
                </div>
            </div>
        </div>

        $1`
    );
}
fs.writeFileSync('index.html', indexHtml);
console.log("Fixed index.html tabs");
