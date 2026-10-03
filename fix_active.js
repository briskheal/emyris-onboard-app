const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/isActive: true/g, "status: 'Active'");

fs.writeFileSync('routes/xl.js', c);
