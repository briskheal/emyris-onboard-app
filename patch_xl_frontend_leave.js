const fs = require('fs');
let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/extras/LeaveRequest.tsx', 'utf8');

file = file.replace(/return parsed\.uid \|\| parsed\.employeeId \|\| '';/g, "return parsed.employeeId || parsed.uid || parsed.email || '';");
file = file.replace(/MUST prioritize UID for XlAssignedLeave/g, "Use native employeeId first");

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/extras/LeaveRequest.tsx', file);
console.log("Patched xl-frontend LeaveRequest.tsx to use employeeId!");
