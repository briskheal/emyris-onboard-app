const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

// Add History button in Header
const headerSearch = `<PackageSearch size={20} className="mr-2 text-cyan-400" />\n        <h1 className="text-white font-bold tracking-wide uppercase">{editId ? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"}</h1>`;

const headerReplacement = `<PackageSearch size={20} className="mr-2 text-cyan-400" />\n        <h1 className="text-white font-bold tracking-wide uppercase flex-1">{editId ? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"}</h1>\n        <button onClick={() => navigate('/creation/primary-sales/history')} className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg active:scale-95 border border-cyan-500/20">\n          HISTORY\n        </button>`;

if (f.includes(headerSearch) && !f.includes("HISTORY</button>")) {
    f = f.replace(headerSearch, headerReplacement);
    fs.writeFileSync(path, f);
    console.log('Added History button to PrimarySalesForm header');
} else {
    console.log('Could not add History button or already present');
}
