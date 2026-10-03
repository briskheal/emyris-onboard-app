const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(
    'console.error("Dashboard Stats Error:", e);',
    'console.error("Dashboard Stats Error:", e); require("fs").writeFileSync("xla-frontend/dist/dash_error.txt", String(e.stack)); require("fs").writeFileSync("dash_error.txt", String(e.stack));'
);
fs.writeFileSync('routes/xl.js', c);
