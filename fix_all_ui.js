const fs = require('fs');

console.log("Starting full UI fix...");

// --- 1. Fix admin.html ---
let adminHtml = fs.readFileSync('admin.html', 'utf8');

// Replace the Exam Reports button with Exam Submissions button
if (adminHtml.includes("switchAdminTab('examreports')")) {
    adminHtml = adminHtml.replace(
        /<button class="tab-btn" onclick="switchAdminTab\('examreports'\)">.*?<\/button>/g,
        `<button class="tab-btn" onclick="switchAdminTab('examsubmissions'); fetchPendingExams();">📝 Exam Submissions</button>`
    );
    console.log("Replaced examreports button");
}

// Inject the Exam Submissions Tab Content right before the old Exam Reports Tab Content
if (!adminHtml.includes('id="adminExamSubmissionsTab"')) {
    const tabHTML = `
    <!-- Exam Submissions Tab (NEW) -->
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
    `;
    adminHtml = adminHtml.replace('<!-- Exam Reports Tab -->', tabHTML + '\n<!-- Exam Reports Tab -->');
    console.log("Injected adminExamSubmissionsTab");
}

fs.writeFileSync('admin.html', adminHtml);


// --- 2. Fix admin-script.js ---
let adminJs = fs.readFileSync('admin-script.js', 'utf8');

// Add the routing for examsubmissions
const targetSwitch = `    } else if (tab === 'testbank') {
        document.getElementById('adminTestbankTab').classList.remove('hidden');
        fetchTestBankQuestions();
    } else if (tab === 'examreports') {
        document.getElementById('adminExamreportsTab').classList.remove('hidden');
        fetchExamReports();
    } else {`;

const newSwitch = `    } else if (tab === 'testbank') {
        document.getElementById('adminTestbankTab').classList.remove('hidden');
        fetchTestBankQuestions();
    } else if (tab === 'examsubmissions') {
        document.getElementById('adminExamSubmissionsTab').classList.remove('hidden');
        fetchPendingExams();
    } else if (tab === 'examreports') {
        document.getElementById('adminExamreportsTab').classList.remove('hidden');
        fetchExamReports();
    } else {`;

if (adminJs.includes(targetSwitch)) {
    adminJs = adminJs.replace(targetSwitch, newSwitch);
    console.log("Fixed switchAdminTab in admin-script.js");
}

fs.writeFileSync('admin-script.js', adminJs);

console.log("Full UI fix completed!");
