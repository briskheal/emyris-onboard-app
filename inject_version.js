const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(
    "router.get('/admin/debug-data'",
    "router.get('/version', (req, res) => res.json({ version: 'fixed_targets_1.0' }));\nrouter.get('/admin/debug-data'"
);
fs.writeFileSync('routes/xl.js', c);
