const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Attendance.tsx';
let content = fs.readFileSync(rPath, 'utf8');

const regex3 = /const isWeekend = !workingDaysPref\[dayStr\] \|\| monthHolidays\.some\(\(h: any\) => h\.date === selectedDate && \(!h\.state \|\| h\.state === 'All' \|\| h\.state === 'N\/A' \|\| h\.state === '' \|\| h\.state === user\.state\)\);/g;
const replacement3 = `const isWeeklyOff = !workingDaysPref[dayStr];`;

if (regex3.test(content)) {
    content = content.replace(regex3, replacement3);
    
    // Now inject the user-specific check inside the loop
    const regex4 = /if \(isWeekend\) status = 'H';/g;
    const replacement4 = `const isHoliday = isWeeklyOff || monthHolidays.some((h: any) => h.date === selectedDate && (!h.state || h.state === 'All' || h.state === 'N/A' || h.state === '' || h.state === user.state));
              if (isHoliday) status = 'H';`;
    
    content = content.replace(regex4, replacement4);
    
    fs.writeFileSync(rPath, content, 'utf8');
    console.log("Patched Attendance.tsx daily logic inside loop");
} else {
    console.log("Regex 3 not matched");
}
