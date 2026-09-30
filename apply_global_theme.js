const fs = require('fs');

// 1. Refactor Dashboard.tsx
let dashboard = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

// The toggle function in Dashboard.tsx currently uses state. We will change it to toggle documentElement class as well.
dashboard = dashboard.replace(/const \[isLightMode, setIsLightMode\] = useState\(\(\) => \{\n\s*return localStorage.getItem\('xla_theme'\) === 'light';\n\s*\}\);\n\n\s*useEffect\(\(\) => \{\n\s*localStorage\.setItem\('xla_theme', isLightMode \? 'light' : 'dark'\);\n\s*\}, \[isLightMode\]\);/, 
`const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('xla_theme') === 'light';
  });

  useEffect(() => {
    localStorage.setItem('xla_theme', isLightMode ? 'light' : 'dark');
    if (isLightMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [isLightMode]);`);

// Fix the main div to just use dark: variants and not manually append "dark"
dashboard = dashboard.replace(/className=\{"min-h-full flex flex-col pb-24 font-sans transition-colors " \+ \(isLightMode \? "bg-slate-50 text-slate-900" : "bg-slate-50 dark:bg-\[\#1a1a2e\] text-slate-800 dark:text-slate-100 dark"\)\}/g, 
`className="min-h-full flex flex-col pb-24 font-sans transition-colors bg-slate-50 dark:bg-[#1a1a2e] text-slate-900 dark:text-slate-100"`);

// If there are other places where `isLightMode ?` is used, maybe leave them if they don't break, but they should ideally use dark: classes.
fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', dashboard);


// 2. Refactor Layout.tsx
let layout = fs.readFileSync('xla-frontend/src/components/Layout.tsx', 'utf8');

// We also want Layout to initialize the theme so it doesn't flash white/dark on load
layout = layout.replace(/const \[isSidebarCollapsed, setIsSidebarCollapsed\] = useState\(false\);/,
`const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('xla_theme') !== 'light') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);`);

// Replace classes in Layout.tsx
layout = layout.replace(/bg-slate-900/g, "bg-white dark:bg-slate-900");
layout = layout.replace(/border-slate-800/g, "border-slate-200 dark:border-slate-800");
layout = layout.replace(/border-slate-700\/60/g, "border-slate-200 dark:border-slate-700/60");
layout = layout.replace(/text-white/g, "text-slate-900 dark:text-white");
layout = layout.replace(/hover:text-white/g, "hover:text-slate-900 dark:hover:text-white");
layout = layout.replace(/hover:bg-slate-800/g, "hover:bg-slate-100 dark:hover:bg-slate-800");
layout = layout.replace(/bg-slate-800/g, "bg-slate-100 dark:bg-slate-800");
layout = layout.replace(/text-slate-300/g, "text-slate-600 dark:text-slate-300");
layout = layout.replace(/text-slate-400/g, "text-slate-500 dark:text-slate-400");
layout = layout.replace(/hover:text-slate-200/g, "hover:text-slate-700 dark:hover:text-slate-200");
layout = layout.replace(/hover:bg-slate-700/g, "hover:bg-slate-200 dark:hover:bg-slate-700");

fs.writeFileSync('xla-frontend/src/components/Layout.tsx', layout);
console.log('Fixed theme logic for whole page');
