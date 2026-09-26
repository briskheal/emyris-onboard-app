const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

const target = `<h1 className="text-white font-bold tracking-wide uppercase">Primary Sales</h1>`;
const replacement = `<h1 className="text-white font-bold tracking-wide uppercase flex-1">{editId ? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"}</h1>
        <button onClick={() => navigate('/creation/primary-sales/history')} className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1.5 rounded-lg active:scale-95 border border-cyan-500/20">
          HISTORY
        </button>`;

if (f.includes(target)) {
    f = f.replace(target, replacement);
    fs.writeFileSync(path, f);
    console.log('Patched header successfully');
}
