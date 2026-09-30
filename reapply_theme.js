const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

if (!c.includes('const [isLightMode, setIsLightMode]')) {
    // 2. Inject Light/Dark mode state
    c = c.replace(/export default function Dashboard\(\) \{/, `export default function Dashboard() {\n  const [isLightMode, setIsLightMode] = useState(true);`);

    // 3. Make Sun button functional
    c = c.replace(/<button className="text-\[\#8b8baf\] hover:text-amber-400 transition-colors relative hidden sm:flex items-center gap-1 group" title="Change Theme">/, `<button onClick={() => setIsLightMode(!isLightMode)} className="text-slate-500 dark:text-[#8b8baf] hover:text-amber-500 dark:hover:text-amber-400 transition-colors relative hidden sm:flex items-center gap-1 group" title="Toggle Theme">`);

    // 4. Update the outermost wrapper
    c = c.replace(/<div className="min-h-full bg-\[\#1a1a2e\] flex flex-col pb-24 text-slate-100 font-sans">/, `<div className={"min-h-full flex flex-col pb-24 font-sans transition-colors " + (isLightMode ? "bg-slate-50 text-slate-900" : "bg-[#1a1a2e] text-slate-100 dark")}>`);

    // 5. Replace hardcoded colors with dark: enabled colors
    c = c.replace(/bg-\[\#212136\]/g, 'bg-white dark:bg-[#212136]');
    c = c.replace(/bg-\[\#1e1e30\]/g, 'bg-white dark:bg-[#1e1e30]');
    c = c.replace(/bg-\[\#27273f\]/g, 'bg-slate-100 dark:bg-[#27273f]');
    c = c.replace(/bg-\[\#1a1a2e\]/g, 'bg-slate-50 dark:bg-[#1a1a2e]');
    c = c.replace(/border-\[\#3b3b5a\]/g, 'border-slate-200 dark:border-[#3b3b5a]');
    c = c.replace(/text-slate-100/g, 'text-slate-800 dark:text-slate-100');
    c = c.replace(/text-slate-200/g, 'text-slate-700 dark:text-slate-200');
    c = c.replace(/text-slate-300/g, 'text-slate-600 dark:text-slate-300');
    c = c.replace(/text-\[\#8b8baf\]/g, 'text-slate-500 dark:text-[#8b8baf]');
    c = c.replace(/text-white/g, 'text-slate-900 dark:text-white');

    // Add color-scheme to month input
    c = c.replace(/type="month"\s+className="/, `type="month" style={{ colorScheme: isLightMode ? 'light' : 'dark' }} className="`);

    fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
    console.log('Done reapplying theme');
} else {
    console.log('isLightMode already exists');
}
