const fs = require('fs');
let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let content = fs.readFileSync(rPath, 'utf8');

const regex = /const endDate = \`\$\{year\}-\$\{month\.padStart\(2, '0'\)\}-31\`\;/g;
if(regex.test(content)) {
    content = content.replace(regex, "const _ld = new Date(parseInt(year), parseInt(month), 0).getDate();\n        const endDate = `${year}-${month.padStart(2, '0')}-${String(_ld).padStart(2, '0')}`;");
    fs.writeFileSync(rPath, content, 'utf8');
    console.log("Patched CallPlan 31 successfully");
} else {
    console.log("Not found");
}
