const fs = require('fs');

const files = [
    'xla-frontend/src/pages/ManageAllowances.tsx',
    'xla-frontend/src/pages/ManageLocations.tsx',
    'xla-frontend/src/pages/ManageProducts.tsx',
    'xla-frontend/src/pages/ManageDCS.tsx'
];

files.forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    let modified = false;

    // 1. Add shrink-0 and adjust width
    if (code.includes('className="w-80 bg-slate-900/80 border-r border-slate-800 flex flex-col relative z-10 backdrop-blur-xl"')) {
        code = code.replace(
            'className="w-80 bg-slate-900/80 border-r border-slate-800 flex flex-col relative z-10 backdrop-blur-xl"', 
            'className="w-64 shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col relative z-10 backdrop-blur-xl"'
        );
        modified = true;
    }

    // 2. Reduce font sizes of BACK TO ADMIN MENU
    if (code.includes('<ArrowLeft size={24} /> <span className="font-black text-xl tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>')) {
        code = code.replace(
            '<ArrowLeft size={24} /> <span className="font-black text-xl tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>', 
            '<ArrowLeft size={18} /> <span className="font-black text-xs tracking-widest text-sky-400 uppercase hover:text-white transition-colors">BACK TO ADMIN MENU</span>'
        );
        modified = true;
    }

    // 3. Manage Locations H2
    if (code.includes('<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE LOCATIONS</h2>')) {
        code = code.replace(
            '<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE LOCATIONS</h2>', 
            '<h2 className="text-white font-black text-sm tracking-widest uppercase">MANAGE LOCATIONS</h2>'
        );
        modified = true;
    }
    
    // 4. Manage Allowances H2
    if (code.includes('<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE EXPENSES</h2>')) {
        code = code.replace(
            '<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE EXPENSES</h2>', 
            '<h2 className="text-white font-black text-sm tracking-widest uppercase">MANAGE EXPENSES</h2>'
        );
        modified = true;
    }

    // 5. Manage Products H2
    if (code.includes('<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE PRODUCTS</h2>')) {
        code = code.replace(
            '<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE PRODUCTS</h2>', 
            '<h2 className="text-white font-black text-sm tracking-widest uppercase">MANAGE PRODUCTS</h2>'
        );
        modified = true;
    }
    
    // 6. Manage DCS H2
    if (code.includes('<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE DOCTORS, STOCKISTS & CHEMISTS</h2>')) {
        code = code.replace(
            '<h2 className="text-white font-black text-xl tracking-widest uppercase">MANAGE DOCTORS, STOCKISTS & CHEMISTS</h2>', 
            '<h2 className="text-white font-black text-sm tracking-widest uppercase">MANAGE DOCTORS, STOCKISTS & CHEMISTS</h2>'
        );
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, code);
        console.log(`Fixed sidebar in ${file}`);
    }
});
