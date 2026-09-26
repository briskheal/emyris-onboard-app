const fs = require('fs');
const lines = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes("activeSubTab === 'yearly'"));
console.log(lines.slice(start + 45, start + 75).join('\n'));
