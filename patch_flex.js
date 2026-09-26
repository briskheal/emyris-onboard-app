const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesHistory.tsx';
let f = fs.readFileSync(path, 'utf8');

// replace grid header
f = f.replace(
    /className="grid grid-cols-\[11fr_4fr_3fr_3fr\].*?"/g,
    'className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#3b3b5a]/40 w-full"'
);

// We need to specifically replace the header row to keep it sticky and smaller padding
f = f.replace(
    'className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#3b3b5a]/40 w-full">\\n          <div className="text-[9px]',
    'className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#181826] border-b border-[#3b3b5a] shrink-0 sticky top-[53px] z-10 w-full">\\n          <div className="w-[40%] text-[9px]'
);

// Replace col 1
f = f.replace(/<div className="text-\[9px\]/g, '<div className="w-[20%] text-[9px]');

// Replace col 1 in map
f = f.replace(/<div className="flex flex-col overflow-hidden">/g, '<div className="w-[40%] flex flex-col overflow-hidden">');

// col 2
f = f.replace(/<div className="text-\[10px\]/g, '<div className="w-[20%] text-[10px]');

// col 3
f = f.replace(/<div className={`flex justify-center \${/g, '<div className={`w-[20%] flex justify-center ${');

// col 4
f = f.replace(/<div className="flex justify-end">/g, '<div className="w-[20%] flex justify-end">');


// Also wrap the inner map return with error boundary logic? No, just the flex.
fs.writeFileSync(path, f);
console.log('done');
