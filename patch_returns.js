const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix the labels
c = c.replace(/Base Price \([^)]+\)/g, 'Base Price (₹)');
c = c.replace(/Rtn Price \([^)]+\)/g, 'Rtn Price (₹)');

// Replace the two inputs classes
c = c.replace(
  /className="w-full bg-transparent border-b border-\[#3b3b5a\] text-xs text-white p-1 focus:outline-none focus:border-red-500"/g,
  'className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 text-xs text-white text-center focus:outline-none focus:border-cyan-500"'
);

// Fix rtnPriceType select styling
c = c.replace(
  /className="w-full bg-transparent border-b border-\[#3b3b5a\] p-1 text-xs text-red-400 font-bold focus:outline-none appearance-none cursor-pointer"/g,
  'className="w-full bg-[#1e2032] border border-[#3b3b5a] rounded p-1.5 pr-6 text-xs text-red-400 font-bold focus:outline-none appearance-none cursor-pointer"'
);

fs.writeFileSync(path, c);
console.log('Fixed styling');
