const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesForm.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix stockist linking
c = c.replace(/stockists\.map\(\(s:any\) => \(\s*<option key=\{s\.stockistName\} value=\{s\.stockistName\} className=\"bg-\[\#1e2032\]\">\{s\.stockistName\}<\/option>\s*\)\)/, 
`stockists.map((s:any) => (
              <option key={s.businessName || s.name} value={s.businessName || s.name} className="bg-[#1e2032]">{s.businessName || s.name}</option>
            ))`);

// Fix product linking
c = c.replace(/p\.name === prodName/g, "(p.productName || p.name) === prodName");
c = c.replace(/p\.name\?\.toLowerCase/g, "(p.productName || p.name)?.toLowerCase");
c = c.replace(/key=\{p\.name\}/g, "key={p.productName || p.name}");
c = c.replace(/selectProductForRow\(p\.name\)/g, "selectProductForRow(p.productName || p.name)");
c = c.replace(/\{p\.name\}/g, "{p.productName || p.name}");

// Fix UI buttons
const oldAddProductBtn = `className="flex-1 py-4 border border-dashed border-[#3b3b5a] hover:border-sky-500/50 hover:bg-sky-500/5 rounded-2xl flex items-center justify-center gap-2 text-sky-400 font-bold transition-all"`;
const newAddProductBtn = `className="flex-1 py-3 border border-dashed border-[#3b3b5a] hover:border-sky-500/50 hover:bg-sky-500/5 rounded-2xl flex items-center justify-center gap-2 text-sky-400 font-bold transition-all text-sm"`;
c = c.replace(oldAddProductBtn, newAddProductBtn);

const oldSubmitBtn = `className="w-[120px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"`;
const newSubmitBtn = `className="w-[100px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform text-sm"`;
c = c.replace(oldSubmitBtn, newSubmitBtn);

fs.writeFileSync(path, c);
console.log('Fixed linking and button UI sizes.');
