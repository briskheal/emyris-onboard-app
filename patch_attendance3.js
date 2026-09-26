const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Attendance.tsx';
let content = fs.readFileSync(rPath, 'utf8');

const regex2 = /const isWeekend = !workingDaysPref\[dayStr\] \|\| monthHolidays\.includes\(selectedDate\);/g;
const replacement2 = `const isWeekend = !workingDaysPref[dayStr] || monthHolidays.some((h: any) => h.date === selectedDate && (!h.state || h.state === 'All' || h.state === 'N/A' || h.state === '' || h.state === user.state));`;

if (regex2.test(content)) {
    content = content.replace(regex2, replacement2);
    fs.writeFileSync(rPath, content, 'utf8');
    console.log("Patched Attendance.tsx daily logic");
} else {
    console.log("Regex 2 not matched");
}
