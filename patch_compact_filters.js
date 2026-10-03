const fs = require('fs');

function compactFilters(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Currently the header/controls is wrapped in:
    // <div className="p-4 md:p-6 border-b border-[#3b3b5a] bg-[#1c1c2e] shrink-0">
    //   <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full justify-between">
    //     <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
    //       <div className="w-full md:w-1/2">
    //         <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select State</h2>
    //         <CustomLocationSelect ... />
    //       </div>
    //       <div className="w-full md:w-1/2">
    //         <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Select HQ</h2>
    //         ...
    //       </div>
    //     </div>
    //     <div className="w-full md:w-1/3 pt-6 md:pt-0">
    //       <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2 md:opacity-0 md:block">Search</h2>
    //       ...
    //     </div>
    //   </div>
    // </div>

    // Let's replace the whole top section with a tight flex layout.
    // We will just do a regex replace to catch everything up to the CustomLocationSelects.

    content = content.replace(
        /<div className="p-4 md:p-6 border-b border-\[#3b3b5a\] bg-\[#1c1c2e\] shrink-0">[\s\S]*?<div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full justify-between">\s*<div className="flex flex-col md:flex-row gap-4 w-full md:w-2\/3">/g,
        `<div className="p-4 md:p-6 shrink-0">\n          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">`
    );

    content = content.replace(
        /<div className="w-full md:w-1\/2">/g,
        `<div>`
    );

    content = content.replace(
        /<\/div>\s*<\/div>\s*<div className="w-full md:w-1\/3 pt-6 md:pt-0">/g,
        `</div>\n            <div>`
    );
    
    content = content.replace(
        /md:opacity-0 md:block/g,
        ``
    );

    fs.writeFileSync(file, content);
}

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    compactFilters(`xla-frontend/src/pages/${name}.tsx`);
});

console.log("Compacted filter layouts.");
