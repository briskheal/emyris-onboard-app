const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/onClick=\{\(\) => \{ setSelectedDashboardUser\(u\); setUserSearchOpen\(false\); setUserSearchTerm\(''\); \}\}/, 
"onMouseDown={(e) => { e.preventDefault(); setSelectedDashboardUser(u); setUserSearchOpen(false); setUserSearchTerm(''); }}");

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed dropdown selection bug');
