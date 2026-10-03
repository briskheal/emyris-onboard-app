const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// The main return wrapper for SetTargetTab
const oldReturn = '  return (\n    <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto">';
const newReturn = '  return (\n    <div className="w-full">';

c = c.replace(oldReturn, newReturn);

// Wrap `activeSubTab === 'main'`
c = c.replace(
  "{activeSubTab === 'main' && (\n      <>",
  "{activeSubTab === 'main' && (\n      <div className=\"bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto\">"
);
c = c.replace(
  "        </>\n      )}",
  "        </div>\n      )}"
);

// Wrap `activeSubTab === 'monthly'`
c = c.replace(
  "{activeSubTab === 'monthly' && (\n        <div>",
  "{activeSubTab === 'monthly' && (\n        <div className=\"bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto\">"
);

// For Yearly, we want it entirely full bleed without nested cards!
// It currently has: <div className="bg-slate-800/80 rounded-2xl border border-slate-700 relative shadow-xl p-8 max-w-[98%] mx-auto w-full">
// Let's change it to just <div className="w-full px-4 pb-12">
c = c.replace(
  '<div className="bg-slate-800/80 rounded-2xl border border-slate-700 relative shadow-xl p-8 max-w-[98%] mx-auto w-full">',
  '<div className="w-full px-4 pb-12">'
);

// And the inner table wrapper for Yearly currently has:
// <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">
// Let's remove the heavy border and bg, and just keep it overflow-hidden.
c = c.replace(
  '<div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">',
  '<div className="w-full flex flex-col mt-4 bg-slate-900 border border-slate-800 shadow-sm">'
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Removed nested cards and made Yearly targets full width!');
