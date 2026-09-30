const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/className="flex items-center bg-white dark:bg-slate-50 dark:bg-\[\#1a1a2e\] border border-slate-300 dark:border-emerald-500\/30 rounded-lg h-\[42px\] px-3 focus-within:border-emerald-500\/50 transition-colors shadow-sm dark:shadow-none"/,
'className="flex items-center bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded-xl h-[42px] px-3 focus-within:border-emerald-500/50 transition-colors shadow-sm dark:shadow-none"');

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed search box background');
