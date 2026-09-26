const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx';
let content = fs.readFileSync(rPath, 'utf8');

// Use regex to strictly replace the displayedData block
const regex = /if\s*\(reportType\s*===\s*'Calls with Holidays'\)\s*\{\s*return\s*reportData\.filter[^\}]+\}\s*if\s*\(reportType\s*===\s*'Show Last Call Report'\)/;

const replacement = `if (reportType === 'Calls with Holidays') {
      return reportData;
    }
    if (reportType === 'Call Report') {
      return reportData.filter(r => !r.isHoliday && !r.isWeeklyOff);
    }
    if (reportType === 'Show Last Call Report')`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(rPath, content, 'utf8');
    console.log("Patched CallReport.tsx successfully!");
} else {
    console.log("Regex didn't match anything!");
}
