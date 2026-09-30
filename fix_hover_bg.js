const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/components/Layout.tsx', 'utf8');

c = c.replace(/hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800/g, 'hover:bg-slate-100 dark:hover:bg-slate-800');

fs.writeFileSync('xla-frontend/src/components/Layout.tsx', c);
console.log('Fixed hover background string interpolation issue');
