const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/<div className="lg:col-span-3">/, '<div className="lg:col-span-3 flex flex-col">');
c = c.replace(/<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">/, '<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 flex-1">');

c = c.replace(/<div className="lg:col-span-1">/, '<div className="lg:col-span-1 flex flex-col">');
c = c.replace(/className="bg-white dark:bg-\[\#212136\] border border-slate-200 dark:border-\[\#3b3b5a\]\/50 rounded-3xl p-6 shadow-lg h-\[calc\(100\%-2rem\)\] flex flex-col justify-between"/, 'className="bg-white dark:bg-[#212136] border border-slate-200 dark:border-[#3b3b5a]/50 rounded-2xl p-6 shadow-lg flex-1 flex flex-col justify-center gap-6"');

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed Call Averages height');
