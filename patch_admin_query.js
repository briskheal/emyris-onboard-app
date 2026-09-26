const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', 'utf8');

f = f.replace(/date: \{ \[Op\.like\]: `\$\{year\}-\$\{monthStrNum\}%` \},/g, 'date: { [Op.startsWith]: `${year}-${monthStrNum}` },');
f = f.replace(/\{ employeeId: applicant\.empCode \},/g, '{ employeeId: String(applicant.empCode || "") },');
f = f.replace(/\{ employeeId: applicant\.email \},/g, '{ employeeId: String(applicant.email || "") },');
f = f.replace(/\{ employeeId: applicant\.uid \}/g, '{ employeeId: String(applicant.uid || "") }');

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', f);
console.log('Patched routes/admin.js successfully');
