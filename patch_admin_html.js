const fs = require('fs');
let adminHtml = fs.readFileSync('admin.html', 'utf8');

const regex = /<label[\s\S]*?>Active Exam Date:<\/label>[\s\S]*?<input type="date" id="activeExamDateInput"[\s\S]*?>[\s\S]*?<label[\s\S]*?>Target Product:<\/label>[\s\S]*?<select id="activeExamProductInput"[\s\S]*?>[\s\S]*?<\/select>[\s\S]*?<button class="btn btn-primary btn-sm" onclick="saveExamSchedule\(\)">Save Schedule<\/button>/;

const replacement = `<label style="font-size: 0.8rem; color: var(--text-muted);">Active Exam Date:</label>
                                    <input type="date" id="activeExamDateInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem;">
                                    
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Product:</label>
                                    <select id="activeExamProductInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                        <option value="General">General / All</option>
                                    </select>

                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">MCQ Time (m):</label>
                                    <input type="number" id="examMcqTimeInput" value="15" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; width: 60px;">
                                    
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Desc Time (m):</label>
                                    <input type="number" id="examDescTimeInput" value="15" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; width: 60px;">
                                    
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">MCQ Max Count:</label>
                                    <input type="number" id="examMcqCountInput" value="10" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; width: 60px;">

                                    <button class="btn btn-primary btn-sm" onclick="saveExamSchedule()">Save Schedule</button>`;

if (regex.test(adminHtml)) {
    adminHtml = adminHtml.replace(regex, replacement);
    fs.writeFileSync('admin.html', adminHtml);
    console.log("Successfully patched admin.html");
} else {
    console.log("Failed to match admin.html");
}
