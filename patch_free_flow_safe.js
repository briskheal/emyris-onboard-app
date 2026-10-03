const fs = require('fs');

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove outermost bounds
    content = content.replace(
        /<div className="flex-1 flex flex-col h-full bg-\[#1e1e2d\] relative font-sans overflow-hidden">/,
        `<div className="flex-1 flex flex-col min-h-screen bg-[#1e1e2d] relative font-sans">`
    );

    // 2. Remove middle bounds
    content = content.replace(
        /<div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">/,
        `<div className="p-4 md:p-6">`
    );

    // 3. Remove inner bounds
    // We are replacing `<div className="flex-1 bg-[#151521] overflow-hidden flex flex-col">` with `<div className="w-full">`
    content = content.replace(
        /<div className="flex-1 bg-\[#151521\] overflow-hidden flex flex-col">/,
        `<div className="w-full">`
    );
    
    // 4. Change table scroll wrapper
    // We are replacing `<div className="overflow-x-auto overflow-y-auto flex-1">` with `<div className="overflow-x-auto w-full pb-10">`
    content = content.replace(
        /<div className="overflow-x-auto overflow-y-auto flex-1">/,
        `<div className="overflow-x-auto w-full pb-10">`
    );

    fs.writeFileSync(file, content);
});

console.log("Made tables free-flowing properly.");
