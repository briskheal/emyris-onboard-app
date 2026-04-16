
const fs = require('fs');
const content = fs.readFileSync('d:/MY WORK FLOW/Emyris Onboard App/script.js', 'utf8');
const lines = content.split('\n');
const functionNames = {};

lines.forEach((line, index) => {
    const asyncMatch = line.match(/async\s+function\s+([a-zA-Z0-9_]+)\s*\(/);
    const syncMatch = line.match(/(?<!async\s+)function\s+([a-zA-Z0-9_]+)\s*\(/);
    
    if (asyncMatch) {
         const name = asyncMatch[1];
        if (!functionNames[name]) functionNames[name] = [];
        functionNames[name].push(index + 1);
    } else if (syncMatch) {
        const name = syncMatch[1];
        if (!functionNames[name]) functionNames[name] = [];
        functionNames[name].push(index + 1);
    }
});

Object.entries(functionNames).forEach(([name, lines]) => {
    if (lines.length > 1) {
        console.log(`Duplicate function: ${name} at lines ${lines.join(', ')}`);
    }
});
