const fs = require('fs');
const c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');
const start = c.indexOf("{activeSubTab === 'yearly' && (");
const end = c.indexOf("function AddTargetView", start);
fs.writeFileSync('scratch/yearly_block.txt', c.substring(start, end));
console.log('Saved to scratch/yearly_block.txt');
