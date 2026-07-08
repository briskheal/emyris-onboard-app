const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

const upgradeStrStart = "if (!req.path.startsWith('/api/')) {\\n        res.status(503).send(\`";
const upgradeStrRegex = /if \(!req\.path\.startsWith\('\/api\/'\)\) \{\s*res\.status\(503\)\.send\([\s\S]*?\);\s*\}\s*else\s*\{/m;

if (upgradeStrRegex.test(code)) {
    code = code.replace(upgradeStrRegex, "if (!req.path.startsWith('/api/')) {\n        res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));\n    } else {");
    fs.writeFileSync('server.js', code);
    console.log('Patched server.js successfully.');
} else {
    console.log('Could not find the upgradation block in server.js.');
}
