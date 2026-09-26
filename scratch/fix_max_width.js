const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(/return \(\r?\n\s*<div className="max-w-4xl">/, 'return (\n    <div className="w-full px-4 pb-12">');

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed outer wrapper');
