const fs = require('fs');

const pages = [
    'DoctorsListReport',
    'ChemistsListReport',
    'StockistsListReport'
];

pages.forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Add w-[1%] whitespace-nowrap to columns that should shrink wrap
    const columnsToShrink = [
        'Sr no.',
        'Degree',
        'Specialization',
        'Contact',
        'HQ',
        'Working Area',
        'View',
        'Proprietor Name'
    ];

    columnsToShrink.forEach(col => {
        // e.g. <th className="border border-[#3b3b5a] px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sr no.</th>
        // We inject `w-[1%] whitespace-nowrap ` before `px-3`
        // Note that some have symbols like `Contact +``
        
        let regex = new RegExp(`(<th className=")(.*?)(">\\s*${col}.*?</th>)`, 'gi');
        content = content.replace(regex, (match, p1, p2, p3) => {
            if (!p2.includes('w-[1%]')) {
                return `${p1}w-[1%] whitespace-nowrap ${p2}${p3}`;
            }
            return match;
        });
    });

    fs.writeFileSync(file, content);
});

console.log("Made columns shrink wrap.");
