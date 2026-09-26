const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Attendance.tsx';
let content = fs.readFileSync(rPath, 'utf8');

const regex1 = /days\.forEach\(d => \{\s*if \(d\.day === 'Sunday' \|\| d\.day === 'Saturday'\) \{\s*dailyMap\[d\.yyyymmdd\] = 'H';\s*\}\s*\}\);/g;
const replacement1 = `days.forEach(d => {
                const isWeeklyOff = !workingDaysPref[d.day];
                const isStateHoliday = monthHolidays.includes(d.yyyymmdd);
                if (isWeeklyOff || isStateHoliday) {
                    dailyMap[d.yyyymmdd] = 'H';
                }
            });`;

if (regex1.test(content)) {
    content = content.replace(regex1, replacement1);
    fs.writeFileSync(rPath, content, 'utf8');
    console.log("Patched Attendance.tsx");
} else {
    console.log("Regex not matched");
}
