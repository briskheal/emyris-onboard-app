const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');
c = c.replace(
    'const openRoutes = [',
    'const openRoutes = ["/api/xl/admin/dashboard-stats", '
);
fs.writeFileSync('routes/xl_mock.js', c);
