const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/<span className="text-sm font-bold text-emerald-400 leading-none">.*?\{calcs\.finalValue\.toFixed\(2\)\}<\/span>/g, '<span className="text-sm font-bold text-emerald-400 leading-none">₹ {calcs.finalValue.toFixed(2)}</span>');
c = c.replace(/<span className="text-white">.*?\{totals\.gross\.toFixed\(2\)\}<\/span>/g, '<span className="text-white">₹ {totals.gross.toFixed(2)}</span>');
c = c.replace(/<span className="text-red-400">.*?\{totals\.salableRtn\.toFixed\(2\)\}<\/span>/g, '<span className="text-red-400">₹ {totals.salableRtn.toFixed(2)}</span>');
c = c.replace(/<span className="text-red-400">.*?\{totals\.expiryRtn\.toFixed\(2\)\}<\/span>/g, '<span className="text-red-400">₹ {totals.expiryRtn.toFixed(2)}</span>');
c = c.replace(/<span className="text-xl font-bold text-emerald-400">.*?\{totals\.net\.toFixed\(2\)\}<\/span>/g, '<span className="text-xl font-bold text-emerald-400">₹ {totals.net.toFixed(2)}</span>');
c = c.replace(/<span className="text-\[10px\] text-slate-500 ml-2">PTS:.*?\{p\.pts \|\| 0\}<\/span>/g, '<span className="text-[10px] text-slate-500 ml-2">PTS: ₹{p.pts || 0}</span>');

fs.writeFileSync(path, c);
console.log('Fixed symbols');
