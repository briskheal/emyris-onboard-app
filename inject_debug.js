const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/const datePrefix = \`\$\{year\}-\$\{monthNum\}-\`;/g, 
"const datePrefix = `${year}-${monthNum}-`;\\nconsole.log('DASHBOARD DEBUG:', req.query, {month, monthNum, datePrefix});");

fs.writeFileSync('routes/xl.js', c);
console.log('Injected debug statement');
