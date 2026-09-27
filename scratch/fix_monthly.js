const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const regexMonthlyWrapper = /\{activeSubTab === 'monthly' && \(\s*<div className="bg-slate-800\/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto">/;
const replacementMonthlyWrapper = `{activeSubTab === 'monthly' && (\n        <div className="w-full px-4 pb-12">`;
c = c.replace(regexMonthlyWrapper, replacementMonthlyWrapper);

const regexMonthlyInner = /<div className="bg-slate-800\/80 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">/;
const replacementMonthlyInner = `<div className="w-full bg-slate-900 border border-slate-700 overflow-hidden mt-4">`;
c = c.replace(regexMonthlyInner, replacementMonthlyInner);

// Let's also adjust the table padding to fit more rows as planned
// px-4 py-3 instead of p-4
// Let's just leave the p-4 for now, or just replace p-4 with px-4 py-3 in the yearly table?
// Actually, p-4 is fine if the screen is full width.

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed monthly wrappers');
