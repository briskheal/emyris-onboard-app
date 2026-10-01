const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/className="flex items-center bg-white dark:bg-\[\#0f172a\] border border-slate-300 dark:border-slate-800 rounded-xl h-\[42px\] px-3 focus-within:border-emerald-500\/50 transition-colors shadow-sm dark:shadow-none"/,
`className="flex items-center bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded-xl h-[42px] px-3 focus-within:border-emerald-500/50 transition-colors shadow-sm dark:shadow-none cursor-text" onClick={() => { const el = document.getElementById('user-search-input'); if (el) { el.focus(); el.click(); } }}`);

c = c.replace(/type="text"\s+placeholder=\{selectedDashboardUser/m, 
`id="user-search-input"
                              type="text"
                              placeholder={selectedDashboardUser`);

c = c.replace(/<ChevronDown size=\{16\} className="text-slate-400 dark:text-slate-500 shrink-0 ml-1" \/>/,
`<ChevronDown size={16} className="text-slate-400 dark:text-slate-500 shrink-0 ml-1 cursor-pointer pointer-events-none" />`);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Patched Chevron click in user search');
