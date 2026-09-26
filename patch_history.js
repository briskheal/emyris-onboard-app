const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesHistory.tsx';
let f = fs.readFileSync(path, 'utf8');

// 1. Remove onClick from the row wrapper and replace with nothing
f = f.replace(
  'onClick={() => navigate(`/creation/primary-sales?id=${inv._id}`)}',
  ''
);

// 2. Remove cursor-pointer and hover:bg-slate-700/30 from row classes
f = f.replace(
  'hover:bg-slate-700/30 cursor-pointer transition-colors',
  'transition-colors'
);

// 3. Add buttons to Eye and Edit icons
f = f.replace(
  '<div className="bg-sky-500/10 border border-sky-500/20 text-sky-400 p-1.5 rounded-md hover:bg-sky-500/20">',
  '<button onClick={() => navigate(`/creation/primary-sales?id=${inv._id}`)} className="bg-sky-500/10 border border-sky-500/20 text-sky-400 p-1.5 rounded-md hover:bg-sky-500/20 active:scale-95 transition-transform cursor-pointer">'
);
f = f.replace(
  '<Eye size={14} strokeWidth={2} />\\n                      </div>',
  '<Eye size={14} strokeWidth={2} />\\n                      </button>'
);

f = f.replace(
  '<div className="bg-cyan-500 text-white p-1.5 rounded-md shadow-md hover:bg-cyan-400">',
  '<button onClick={() => navigate(`/creation/primary-sales?id=${inv._id}`)} className="bg-cyan-500 text-white p-1.5 rounded-md shadow-md hover:bg-cyan-400 active:scale-95 transition-transform cursor-pointer">'
);
f = f.replace(
  '<Edit2 size={14} strokeWidth={2.5} />\\n                      </div>',
  '<Edit2 size={14} strokeWidth={2.5} />\\n                      </button>'
);

fs.writeFileSync(path, f);
console.log('patched history');
