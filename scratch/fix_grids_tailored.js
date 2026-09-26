const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

let newC = c;

// Fix Personal Details block
newC = newC.replace(
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Personal Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">\n            <div><label className="text-xs text-slate-400 font-bold mb-1 block">FIRST NAME *</label>',
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Personal Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">\n            <div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">FIRST NAME *</label>'
);
newC = newC.replace('<div><label className="text-xs text-slate-400 font-bold mb-1 block">MIDDLE NAME</label>', '<div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">MIDDLE NAME</label>');
newC = newC.replace('<div><label className="text-xs text-slate-400 font-bold mb-1 block">LAST NAME</label>', '<div className="md:col-span-3"><label className="text-xs text-slate-400 font-bold mb-1 block">LAST NAME</label>');
newC = newC.replace('<div><label className="text-xs text-slate-400 font-bold mb-1 block">GENDER</label>', '<div className="md:col-span-1"><label className="text-xs text-slate-400 font-bold mb-1 block">GENDER</label>');
newC = newC.replace('<div><label className="text-xs text-slate-400 font-bold mb-1 block">PHONE NUMBER *</label>', '<div className="md:col-span-2"><label className="text-xs text-slate-400 font-bold mb-1 block">PHONE NUMBER *</label>');

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', newC);
console.log('Fixed grids tailored');
