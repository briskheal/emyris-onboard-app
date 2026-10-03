const fs = require('fs');
const path = require('path');

// 1. Fix ListsLayout.tsx
let layoutFile = 'xla-frontend/src/pages/ListsLayout.tsx';
let layoutContent = fs.readFileSync(layoutFile, 'utf8');

layoutContent = layoutContent.replace(
    /<div className="min-h-full bg-slate-900 flex text-slate-100 font-sans h-screen">/,
    `<div className="min-h-screen bg-slate-900 flex text-slate-100 font-sans">`
);
layoutContent = layoutContent.replace(
    /<div className="w-64 bg-slate-800\/80 border-r border-slate-700\/50 hidden md:flex flex-col h-full shrink-0">/,
    `<div className="w-64 bg-slate-800/80 border-r border-slate-700/50 hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">`
);
layoutContent = layoutContent.replace(
    /<div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-\[#1e1e2d\]">/,
    `<div className="flex-1 flex flex-col min-w-0 relative bg-[#1e1e2d]">`
);
fs.writeFileSync(layoutFile, layoutContent);

// 2. Fix the remaining list reports
['GeoFencingListReport', 'GiftsListReport', 'LocationsListReport', 'ProductsListReport', 'RoutesListReport'].forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Make them free flowing
    content = content.replace(
        /<div className="flex-1 flex flex-col h-full bg-\[#1e1e2d\] relative font-sans overflow-hidden">/,
        `<div className="flex-1 flex flex-col min-h-screen bg-[#1e1e2d] relative font-sans">`
    );

    content = content.replace(
        /<div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">/,
        `<div className="p-4 md:p-6">`
    );

    content = content.replace(
        /<div className="flex-1 bg-\[#151521\] overflow-hidden flex flex-col">/,
        `<div className="w-full">`
    );
    
    content = content.replace(
        /<div className="overflow-x-auto overflow-y-auto flex-1">/,
        `<div className="overflow-x-auto w-full pb-10">`
    );
    
    // Some of them have an extra Export button at the bottom, just in case, we'll try to remove it if it matches precisely
    const oldExportRegex = /\{\/\*\s*Export Footer\s*\*\/\}[\s\S]*?<\/button>\s*<\/div>/g;
    content = content.replace(oldExportRegex, '');

    // Reduce table row and header vertical paddings to match ManageDCS/Expense
    content = content.replace(/py-4/g, 'py-2.5');
    content = content.replace(/px-6/g, 'px-4');

    fs.writeFileSync(file, content);
});

console.log("Made all lists and their layout entirely free-flowing!");
