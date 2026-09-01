const fs = require('fs');
const path = require('path');

function findFiles(dir, exts, results = []) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (file === 'node_modules' || file === '.git' || file === '.gemini') continue;
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    findFiles(fullPath, exts, results);
                } else if (exts.some(ext => file.endsWith(ext) || file === ext)) {
                    results.push({ path: fullPath, size: stat.size });
                }
            } catch(e) {}
        }
    } catch(e) {}
    return results;
}

const dbs = findFiles('d:/MY WORK FLOW', ['.sqlite', '.db', '.env', '.json']);
console.log("Found files:");
dbs.forEach(f => {
    if (f.path.includes('.sqlite') || f.path.includes('.db') || f.path.includes('.env')) {
        console.log(`${f.path} (${f.size} bytes)`);
    }
});

// Also search all files for alfez.kachhi
console.log("\nSearching for alfez.kachhi across text/sqlite/db files...");
function searchContent(dir) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (file === 'node_modules' || file === '.git' || file === '.gemini') continue;
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    searchContent(fullPath);
                } else if (stat.size < 100000000) { // < 100MB
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.includes('alfez')) {
                        console.log(`Found 'alfez' in: ${fullPath}`);
                    }
                }
            } catch(e) {}
        }
    } catch(e) {}
}
searchContent('d:/MY WORK FLOW');
process.exit(0);
