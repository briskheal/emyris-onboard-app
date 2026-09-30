const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/alert\\\('Admin Notifications dropdown opening\.\.\. \(WIP\)\\\'}/g, "alert('Admin Notifications dropdown opening... (WIP)')}");
c = c.replace(/alert\\\('Admin Notifications dropdown opening\.\.\. \(WIP\)\\'\)/g, "alert('Admin Notifications dropdown opening... (WIP)')");
c = c.replace(/onClick=\{\(\) => alert\(\\'Admin Notifications dropdown opening\.\.\. \(WIP\)\\'\)\}/g, "onClick={() => alert('Admin Notifications dropdown opening... (WIP)')}");
// Just completely rewrite the button to be safe
c = c.replace(/<button onClick=\{\(\) => alert\(.*Admin Notifications dropdown opening\.\.\. \(WIP\).*\}\ className=\"text-\[\#8b8baf\] hover:text-emerald-400 transition-colors relative\" title=\"View Recent Submissions\">/g, 
  `<button onClick={() => alert('Admin Notifications dropdown opening... (WIP)')} className="text-[#8b8baf] hover:text-emerald-400 transition-colors relative" title="View Recent Submissions">`
);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed');
