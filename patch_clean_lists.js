const fs = require('fs');

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    let content = fs.readFileSync(file, 'utf8');

    // Remove the old Export Footer completely
    const oldExportRegex = /\{\/\*\s*Export Footer\s*\*\/\}[\s\S]*?<\/button>\s*<\/div>/g;
    content = content.replace(oldExportRegex, '');

    // The table wrapper has `<div className="flex-1 bg-[#151521] overflow-hidden flex flex-col">`
    // Let's remove the bg so it's seamless with the page, and ensure it stretches nicely.
    content = content.replace(
        /<div className="flex-1 bg-\[#151521\] overflow-hidden flex flex-col">/g,
        `<div className="flex-1 overflow-hidden flex flex-col">`
    );

    // Let's also fix the header spacing slightly so the grid aligns perfectly.
    fs.writeFileSync(file, content);
});

console.log("Cleaned up list reports layout and removed duplicate export buttons.");
