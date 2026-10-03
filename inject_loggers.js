const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');
c = c.replace('console.error("Dashboard Stats Error:", e);', 'console.error("Dashboard Stats Error:", e); require("fs").writeFileSync("xla-frontend/dist/dash_error.txt", String(e.stack));');
c = c.replace('res.json({\n            success: true,\n            data: {', 'require("fs").writeFileSync("xla-frontend/dist/dash_success.txt", JSON.stringify({ targetSum, doctorCalls }));\n        res.json({\n            success: true,\n            data: {');
fs.writeFileSync('routes/xl.js', c);
