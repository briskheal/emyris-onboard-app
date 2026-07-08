const fs = require('fs');

let adminHtml = fs.readFileSync('admin.html', 'utf8');

const regex = /<label[^>]*>Active Exam Date:<\/label>\s*<input type="date" id="activeExamDateInput"[^>]*>\s*<button class="btn btn-primary btn-sm" onclick="saveExamSchedule\(\)">Save Date<\/button>/;

const newStr = `<label style="font-size: 0.8rem; color: var(--text-muted);">Active Exam Date:</label>
                                    <input type="date" id="activeExamDateInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem;">
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Target Product:</label>
                                    <select id="activeExamProductInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">
                                        <option value="General">General / All</option>
                                    </select>
                                    <button class="btn btn-primary btn-sm" onclick="saveExamSchedule()">Save Schedule</button>`;

if (regex.test(adminHtml)) {
    adminHtml = adminHtml.replace(regex, newStr);
    fs.writeFileSync('admin.html', adminHtml);
    console.log('Successfully patched admin.html Target Product Dropdown using regex!');
} else {
    console.log('Failed to find regex match. Please check manually.');
}
