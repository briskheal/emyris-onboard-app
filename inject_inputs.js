const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const targetStr = '<select id="activeExamProductInput" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; max-width: 140px;">\n                                        <option value="General">General / All</option>\n                                    </select>';

if (html.includes(targetStr)) {
    const insertStr = `
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">MCQ Mins:</label>
                                    <input type="number" id="examMcqTimeInput" value="15" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; width: 60px;">
                                    
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">Desc Mins:</label>
                                    <input type="number" id="examDescTimeInput" value="15" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; width: 60px;">
                                    
                                    <label style="font-size: 0.8rem; color: var(--text-muted); margin-left: 5px;">MCQ Count:</label>
                                    <input type="number" id="examMcqCountInput" value="10" class="form-input" style="padding: 4px 8px; font-size: 0.8rem; width: 60px;">`;
    
    html = html.replace(targetStr, targetStr + insertStr);
    
    // Fix the flex wrap so it fits
    const flexStr = '<div style="display: flex; gap: 10px; align-items: center;">\n                                    <label style="font-size: 0.8rem; color: var(--text-muted);">Active Exam Date:</label>';
    const flexReplace = '<div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">\n                                    <label style="font-size: 0.8rem; color: var(--text-muted);">Active Exam Date:</label>';
    html = html.replace(flexStr, flexReplace);
    
    fs.writeFileSync('admin.html', html);
    console.log("Successfully injected inputs");
} else {
    console.log("Failed to find target string in admin.html");
}
