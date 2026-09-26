const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');
c = c.replace(/\\\`/g, '`').replace(/\\\$\{/g, '${');
fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed backticks in ManageUsers.tsx');
