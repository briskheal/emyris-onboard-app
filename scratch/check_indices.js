const fs = require('fs');
const c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');
const start = c.indexOf("{activeSubTab === 'yearly' && (");
const next = c.indexOf("{activeSubTab === 'upload' && (", start);
console.log(start, next);
