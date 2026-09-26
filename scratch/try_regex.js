const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// The main return wrapper for SetTargetTab
c = c.replace(
  /return \(\s*<div className="bg-slate-800\/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto">\s*\{activeSubTab === 'main'/g,
  `return (
    <div className="w-full text-slate-200">
      {activeSubTab === 'main' && (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl max-w-5xl mx-auto">`
);

// Close the div for main
c = c.replace(
  /\s*<\/div>\n\s*<\/div>\n\s*<\/>\n\s*\)}/g,
  `          </div>
            </div>
          </div>
        </div>
      )}`
);

// We need to just do it accurately based on indices since formatting changes too much.
