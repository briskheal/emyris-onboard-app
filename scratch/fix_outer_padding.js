const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  '<div className="flex-1 bg-slate-900 p-8 overflow-y-auto">',
  '<div className={`flex-1 bg-slate-900 overflow-y-auto ${activeTab === \'set_target\' ? \'p-4 md:p-6\' : \'p-8\'}`}>'
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed outer padding');
