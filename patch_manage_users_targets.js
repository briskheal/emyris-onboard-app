const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(/employeeId: targetUser\.uid,/g, 'employeeId: targetUser.employeeId || targetUser.uid,');

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Patched ManageUsers.tsx to save targets using official employeeId');
