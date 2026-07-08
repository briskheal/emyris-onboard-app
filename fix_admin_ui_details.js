const fs = require('fs');

// 1. Fix server.js math
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(
    'const total = exam.autoScore + parseInt(manualScore);',
    'const total = (exam.autoScore || 0) + parseInt(manualScore || 0, 10);'
);
serverJs = serverJs.replace(
    'manualScore: parseInt(manualScore),',
    'manualScore: parseInt(manualScore || 0, 10),'
);
fs.writeFileSync('server.js', serverJs);


// 2. Fix admin.html table headers and CSV button
let adminHtml = fs.readFileSync('admin.html', 'utf8');
if (adminHtml.includes('<h4>📝 Pending Exam Submissions</h4>')) {
    adminHtml = adminHtml.replace(
        '<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Review and manually grade descriptive answers.</p>',
        '<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Review and manually grade descriptive answers.</p>\n                </div>\n                <button class="btn btn-outline btn-sm" onclick="downloadExamReports()">⬇️ Download CSV</button>'
    );
    // Remove the original closing div that we just pushed down
    adminHtml = adminHtml.replace(
        '</p>\n                </div>\n                <button class="btn btn-outline btn-sm" onclick="downloadExamReports()">⬇️ Download CSV</button>\n            </div>',
        '</p>\n                </div>\n                <button class="btn btn-outline btn-sm" onclick="downloadExamReports()">⬇️ Download CSV</button>'
    );
    
    // Fix the table headers
    adminHtml = adminHtml.replace(
        `<th>Product</th>
                            <th>Status</th>
                            <th>Auto MCQ Score</th>
                            <th>Action</th>`,
        `<th>Product</th>
                            <th>Status</th>
                            <th>MCQ Score</th>
                            <th>Manual Score</th>
                            <th>Total Score</th>
                            <th>Action</th>`
    );
    // Update colspan for loading
    adminHtml = adminHtml.replace('<td colspan="6"', '<td colspan="8"');
}
fs.writeFileSync('admin.html', adminHtml);


// 3. Fix admin-script.js row rendering
let adminJs = fs.readFileSync('admin-script.js', 'utf8');
if (adminJs.includes('exam.autoScore} / ${exam.totalQuestions}</td>')) {
    const targetRow = `<td>\${dStr}</td>
            <td><strong>\${exam.name || exam.email}</strong></td>
            <td>\${exam.testedProduct || 'General'}</td>
            <td>\${statusBadge}</td>
            <td>\${exam.autoScore} / \${exam.totalQuestions}</td>
            <td>\${actionBtn}</td>`;
            
    const newRow = `<td>\${dStr}</td>
            <td><strong>\${(exam.name && exam.name.trim()) ? exam.name : exam.email}</strong></td>
            <td>\${exam.testedProduct || 'General'}</td>
            <td>\${statusBadge}</td>
            <td>\${exam.autoScore || 0}</td>
            <td>\${exam.manualScore || 0}</td>
            <td style="font-weight:bold; color:var(--accent);">\${exam.totalScore || 0}</td>
            <td>\${actionBtn}</td>`;
            
    adminJs = adminJs.replace(targetRow, newRow);
    
    // Also fix colspan in "No exams found"
    adminJs = adminJs.replace('<td colspan="6"', '<td colspan="8"');
}
fs.writeFileSync('admin-script.js', adminJs);

console.log("Details fixed!");
