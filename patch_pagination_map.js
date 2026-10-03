const fs = require('fs');

const pages = [
    'DoctorsListReport',
    'ChemistsListReport',
    'StockistsListReport'
];

pages.forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    let content = fs.readFileSync(file, 'utf8');

    // Replace filteredList.map with paginatedList.map for the table rendering
    // Usually it looks like: `) : filteredList.map((d, idx) => (` or `) : filteredList.map((c, idx) => (`
    
    content = content.replace(/filteredList\.map\(\(d, idx\)/g, 'paginatedList.map((d, idx)');
    content = content.replace(/filteredList\.map\(\(c, idx\)/g, 'paginatedList.map((c, idx)');

    // Fix the index number so it shows actual Sr No across pages
    // It's currently `{idx + 1}`
    content = content.replace(/\{idx \+ 1\}/g, '{(currentPage - 1) * itemsPerPage + idx + 1}');

    fs.writeFileSync(file, content);
});

console.log("Fixed pagination map array and index.");
