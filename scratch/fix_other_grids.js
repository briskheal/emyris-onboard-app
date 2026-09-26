const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

let newC = c.replace(
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Employment Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">',
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Employment Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">'
);

// Login Credentials
newC = newC.replace(
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Login Credentials</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">',
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Login Credentials</h3>\n          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">'
);

// Financial Details (4 items)
newC = newC.replace(
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Financial Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">',
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Financial Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">'
);

// Address Details (4 items)
newC = newC.replace(
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Address Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">',
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Address Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">'
);

// Statutory Info (2 items)
newC = newC.replace(
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Statutory Info</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">',
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Statutory Info</h3>\n          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">'
);

// Bank Details (3 items)
newC = newC.replace(
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Bank Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">',
  '<h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-6 border-b border-slate-700 pb-2">Bank Details</h3>\n          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">'
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', newC);
console.log('Fixed other grids tailored');
