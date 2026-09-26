const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const regexMainReturn = /return \(\s*<div className="bg-slate-800\/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto">\s*\{activeSubTab === 'main' && \(\s*<>/;

const replacementMain = `return (
    <div className="w-full h-full text-slate-200">
      
      {activeSubTab === 'main' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto">`;

c = c.replace(regexMainReturn, replacementMain);

// Fix the end of `main` sub-tab
const regexEndMain = /<\/div>\s*<\/div>\s*<\/div>\s*<\/>\s*\)}/;
const replacementEndMain = `          </div>
            </div>
          </div>
        </div>
      )}`;
c = c.replace(regexEndMain, replacementEndMain);

// Fix monthly sub-tab wrapper
const regexMonthly = /\{activeSubTab === 'monthly' && \(\s*<div>/;
const replacementMonthly = `{activeSubTab === 'monthly' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto">`;
c = c.replace(regexMonthly, replacementMonthly);

// Fix yearly wrapper
const regexYearlyOuter = /\{activeSubTab === 'yearly' && \(\s*<div className="bg-slate-800\/80 rounded-2xl border border-slate-700 relative shadow-xl p-8 max-w-\[98%\] mx-auto w-full">/;
const replacementYearlyOuter = `{activeSubTab === 'yearly' && (
        <div className="w-full px-4 pb-12">`;
c = c.replace(regexYearlyOuter, replacementYearlyOuter);

const regexYearlyTable = /<div className="bg-slate-800\/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl flex flex-col">/;
const replacementYearlyTable = `<div className="w-full flex flex-col mt-4 bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">`;
c = c.replace(regexYearlyTable, replacementYearlyTable);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Restructured layouts successfully!');
