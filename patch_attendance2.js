const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Attendance.tsx';
let content = fs.readFileSync(rPath, 'utf8');

const regex1 = /const isStateHoliday = monthHolidays\.includes\(d\.yyyymmdd\);/g;
const replacement1 = `const isStateHoliday = monthHolidays.some((h: any) => h.date === d.yyyymmdd && (!h.state || h.state === 'All' || h.state === 'N/A' || h.state === '' || h.state === user.state));`;

if (regex1.test(content)) {
    content = content.replace(regex1, replacement1);
    fs.writeFileSync(rPath, content, 'utf8');
    console.log("Patched Attendance.tsx state holiday logic");
} else {
    console.log("Regex not matched");
}
