const fs = require('fs');

function fixFile(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');
    
    // Fix stateRes
    c = c.replace(/if \(stateRes\.data\.success\) setStates\(stateRes\.data\.data\);/, 'if (stateRes.data.success) setStates(stateRes.data.states || []);');
    
    // Fix hqRes
    c = c.replace(/if \(hqRes\.data\.success\) setHqs\(hqRes\.data\.data\);/, 'if (hqRes.data.success) setHqs(hqRes.data.hqs || []);');
    
    // Make sure states map doesn't crash even if undefined by using optional chaining
    c = c.replace(/states\.map/g, '(states || []).map');
    c = c.replace(/hqs\.filter/g, '(hqs || []).filter');
    
    fs.writeFileSync(filePath, c);
}

fixFile('xla-frontend/src/pages/DoctorsListReport.tsx');
fixFile('xla-frontend/src/pages/ChemistsListReport.tsx');
fixFile('xla-frontend/src/pages/StockistsListReport.tsx');

console.log("Fixed state and hq API extraction!");
