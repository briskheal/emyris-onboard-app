const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(
    /const condition = designation === 'ADMIN' \? \{ status: \['Submitted', 'Pending', 'pending', 'submitted'\] \} : \{ status: \['Submitted', 'Pending', 'pending', 'submitted'\], employeeId: \{ \[Op\.in\]: reporteeEmails \} \};/g,
    "const condition = designation === 'ADMIN' ? { status: ['Submitted', 'Pending', 'pending', 'submitted', 'Re-Submitted', 're-submitted'] } : { status: ['Submitted', 'Pending', 'pending', 'submitted', 'Re-Submitted', 're-submitted'], employeeId: { [Op.in]: reporteeEmails } };"
);

fs.writeFileSync(path, f);
console.log('Fixed /approvals/counts to include Re-Submitted statuses');
