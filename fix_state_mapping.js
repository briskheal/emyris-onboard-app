const fs = require('fs');

function fixStateMapping(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');
    
    // Replace s.state with s.stateName in the map function
    c = c.replace(/\(states \|\| \[\]\)\.map\(\(s: any\) => s\.state\)/g, '(states || []).map((s: any) => s.stateName)');
    
    fs.writeFileSync(filePath, c);
}

fixStateMapping('xla-frontend/src/pages/DoctorsListReport.tsx');
fixStateMapping('xla-frontend/src/pages/ChemistsListReport.tsx');
fixStateMapping('xla-frontend/src/pages/StockistsListReport.tsx');

console.log("Fixed stateName mapping!");
