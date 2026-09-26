const fs = require('fs');

let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/LeaveRequest.tsx', 'utf8');

file = file.replace(/value: u\.uid,/g, 'value: u.employeeId || u.email || u.uid,');

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/LeaveRequest.tsx', file);
console.log("Patched LeaveRequest.tsx to submit native employeeId!");
