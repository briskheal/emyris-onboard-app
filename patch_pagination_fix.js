const fs = require('fs');

function fixTS(file) {
    let content = fs.readFileSync(file, 'utf8');

    // First find the filteredList declaration and remove it
    const filteredListMatch = content.match(/const filteredList = [\s\S]*?\);/);
    if (filteredListMatch) {
        content = content.replace(filteredListMatch[0], '');
        // Insert it BEFORE the totalPages logic
        content = content.replace(
            /const totalPages = Math\.max\(1, Math\.ceil\(filteredList\.length \/ itemsPerPage\)\);/,
            filteredListMatch[0] + '\n  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));'
        );
    }
    
    fs.writeFileSync(file, content);
}

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    fixTS(`xla-frontend/src/pages/${name}.tsx`);
});

console.log("Fixed TS errors.");
