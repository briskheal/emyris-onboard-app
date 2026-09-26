const fs = require('fs');

const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(
    'className="fixed bottom-16 left-0 right-0 bg-[#1a1b2d] border-t border-slate-700 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-20 md:ml-64 xl:ml-0"',
    'className="fixed bottom-16 w-full max-w-md mx-auto left-1/2 -translate-x-1/2 bg-[#1a1b2d] border-t border-slate-700 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-20"'
);

fs.writeFileSync(path, f);
console.log('PrimarySalesForm layout fixed');
