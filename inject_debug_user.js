const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(
    'const openRoutes = [',
    'const openRoutes = ["/api/xl/debug-user", '
);

c = c.replace(
    "router.get('/admin/debug-data'",
    `router.get('/debug-user', async (req, res) => {
        try {
            const dcrs = await require('../db').XlDCR.findAll({ 
                where: { date: { [require('sequelize').Op.like]: '2026-09-%' } } 
            });
            res.json({ success: true, count: dcrs.length, dcrs });
        } catch(e) {
            res.json({ success: false, error: e.message });
        }
    });\nrouter.get('/admin/debug-data'`
);

fs.writeFileSync('routes/xl.js', c);
