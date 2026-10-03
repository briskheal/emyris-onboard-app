const fs = require('fs');

const pages = [
    'DoctorsListReport',
    'ChemistsListReport',
    'StockistsListReport',
    'GeoFencingListReport',
    'GiftsListReport',
    'LocationsListReport',
    'ProductsListReport',
    'RoutesListReport'
];

pages.forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Unfreeze the layout
    content = content.replace(
        /<div className="flex-1 overflow-hidden flex flex-col">/g,
        `<div className="w-full">`
    );

    // Some of them might still have bg-[#151521] if they weren't fully patched before, catch them too
    content = content.replace(
        /<div className="flex-1 bg-\[#151521\] overflow-hidden flex flex-col">/g,
        `<div className="w-full">`
    );

    // 2. Make table cells Excel-like (tight padding and full borders)
    
    // Replace th padding and add borders
    // Old pattern: `className="px-4 py-2.5 text-[10px] ..."`
    // Or `className="px-4 py-4 ..."`
    
    // First, let's just forcefully inject ` border border-[#3b3b5a] ` into all <th> and <td>
    content = content.replace(/<th className="/g, '<th className="border border-[#3b3b5a] ');
    content = content.replace(/<td className="/g, '<td className="border border-[#3b3b5a] ');

    // Ensure we don't duplicate borders if they already existed
    content = content.replace(/border border-\[#3b3b5a\] border border-\[#3b3b5a\]/g, 'border border-[#3b3b5a]');

    // Replace paddings
    content = content.replace(/px-4 py-2\.5/g, 'px-3 py-1.5');
    content = content.replace(/px-6 py-2\.5/g, 'px-3 py-1.5');
    content = content.replace(/px-4 py-4/g, 'px-3 py-1.5');
    content = content.replace(/px-6 py-4/g, 'px-3 py-1.5');

    // Also on the row, let's ensure it doesn't double border unnecessarily, though border-collapse handles it
    // tr border is already there (border-b border-[#3b3b5a])
    // That's fine.

    fs.writeFileSync(file, content);
});

console.log("Applied Excel grid lines, tight spacing, and fixed scroll freeze.");
