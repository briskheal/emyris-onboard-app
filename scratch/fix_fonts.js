const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// Fix the Yearly Targets table user names to not be bold and large
c = c.replace(
  '<td className="border-r border-slate-700 p-4 text-white font-bold">{t.userName}</td>',
  '<td className="border-r border-slate-700 p-4 text-slate-300 text-sm">{t.userName}</td>'
);

// Fix the dropdowns in Yearly Targets
c = c.replace(
  'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500"',
  'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500"'
);

// Fix the dropdowns in Upload Target Tab
// Target Type dropdown
c = c.replace(
  'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500"',
  'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500"'
);
c = c.replace(
  'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500"',
  'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500"'
);
c = c.replace(
  'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500"',
  'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500"'
);

// Just to be safe, replace all instances globally that match that exact string
let previous = '';
while (c !== previous) {
  previous = c;
  c = c.replace(
    'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500"',
    'className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500"'
  );
}

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed fonts!');
