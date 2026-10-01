const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
            filelist.push(filepath);
        }
    });
    return filelist;
};

const files = walkSync('xla-frontend/src');
let modifiedCount = 0;

for (const f of files) {
    let c = fs.readFileSync(f, 'utf8');
    let originalC = c;

    // We will replace common occurrences. 
    // We can just add a helper function at the top of the file, but that's messy.
    // Instead we can replace `new Date(x).toLocaleDateString(...)` 
    // with inline formatter: 
    // `new Date(x).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')`
    
    // Pattern 1: dt.toLocaleDateString(...)
    c = c.replace(/\b(\w+)\.toLocaleDateString\((?:'en-GB'|undefined).*?\)/g, "$1.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\\//g, '-')");

    // Pattern 2: new Date(...).toLocaleDateString(...)
    c = c.replace(/new Date\((.*?)\)\.toLocaleDateString\((?:'en-GB'|undefined)?.*?\)/g, "new Date($1).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\\//g, '-')");
    
    if (c !== originalC) {
        fs.writeFileSync(f, c);
        modifiedCount++;
    }
}

console.log('Modified ' + modifiedCount + ' files.');
