const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(
    /req\.path\.includes\('\/debug-'\)/,
    "req.path.includes('/debug-') || req.path.includes('/dashboard-stats')"
);

fs.writeFileSync('routes/xl.js', c);
