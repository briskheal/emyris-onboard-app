const fs = require('fs');

const file = 'xla-frontend/src/pages/ManageDCS.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add shrink-0 and adjust width
code = code.replace(
    'className="w-80 bg-slate-900/80 border-r border-slate-800 flex flex-col relative z-10 backdrop-blur-xl"', 
    'className="w-64 shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col relative z-10 backdrop-blur-xl"'
);

// 2. Reduce font sizes
code = code.replace(
    '<ArrowLeft size={24} /> <span className="font-black text-xl tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>', 
    '<ArrowLeft size={18} /> <span className="font-black text-xs tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>'
);

code = code.replace(
    '<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE DOCTORS, STOCKISTS & CHEMISTS</h2>', 
    '<h2 className="text-white font-black text-sm tracking-widest uppercase">MANAGE DOCTORS, STOCKISTS & CHEMISTS</h2>'
);

fs.writeFileSync(file, code);
console.log('Fixed DCS Sidebar successfully.');
