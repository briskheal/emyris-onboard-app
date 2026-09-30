const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/<button className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:shadow-lg hover:shadow-orange-500\/20 transition-all">[\s\S]*?<\/button>/, '');

c = c.replace(/<button className="hidden lg:flex items-center gap-2 bg-emerald-500\/10 text-emerald-400 border border-emerald-500\/30 px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-500\/20 transition-all">[\s\S]*?<\/button>/, '');

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Buttons removed');
