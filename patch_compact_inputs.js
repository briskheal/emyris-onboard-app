const fs = require('fs');

// Compact CustomLocationSelect
let clsContent = fs.readFileSync('xla-frontend/src/components/CustomLocationSelect.tsx', 'utf8');
clsContent = clsContent.replace(/rounded-xl px-4 py-3/g, 'rounded-lg px-3 py-2');
clsContent = clsContent.replace(/min-h-\[50px\]/g, 'min-h-[40px]');
clsContent = clsContent.replace(/w-8 h-8/g, 'w-6 h-6');
clsContent = clsContent.replace(/p-2\.5/g, 'p-2');
clsContent = clsContent.replace(/text-sm/g, 'text-[13px]');
fs.writeFileSync('xla-frontend/src/components/CustomLocationSelect.tsx', clsContent);

// Compact Search input in reports
['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    let content = fs.readFileSync(`xla-frontend/src/pages/${name}.tsx`, 'utf8');
    content = content.replace(/rounded-xl px-4 py-3 text-sm/g, 'rounded-lg px-4 py-2.5 text-[13px]');
    content = content.replace(/left-3 top-3\.5/g, 'left-3 top-3');
    fs.writeFileSync(`xla-frontend/src/pages/${name}.tsx`, content);
});

console.log("Compacted inputs.");
