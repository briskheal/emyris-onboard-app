const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  '<div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">',
  '<div className="w-full flex flex-col bg-slate-900 border border-slate-700 overflow-hidden">'
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed table wrapper');
