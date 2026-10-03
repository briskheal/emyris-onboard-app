const fs = require('fs');

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Outermost container
    content = content.replace(
        /<div className="flex-1 flex flex-col h-full bg-\[#1e1e2d\] relative font-sans overflow-hidden">/g,
        `<div className="flex-1 flex flex-col min-h-screen bg-[#1e1e2d] relative font-sans">`
    );

    // 2. Middle container
    content = content.replace(
        /<div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6">/g,
        `<div className="p-4 md:p-6">`
    );

    // 3. Inner table wrappers
    content = content.replace(
        /<div className="flex-1 overflow-hidden flex flex-col">\s*<div className="overflow-x-auto overflow-y-auto flex-1">/g,
        `<div className="overflow-x-auto w-full pb-10">`
    );

    fs.writeFileSync(file, content);
});

console.log("Made tables free-flowing by removing forced h-full and overflow-hidden bounding boxes.");
