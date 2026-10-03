const fs = require('fs');
let lines = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8').split('\n');
lines[1199] = '      userName: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim(),';
fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', lines.join('\n'));
console.log('Fixed 1200');
