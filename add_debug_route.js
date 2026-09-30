const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const debugRoute = `
router.get('/admin/debug-data', async (req, res) => {
    try {
        const { XlTarget, XlPrimarySales, XlUser } = require('../db');
        const targets = await XlTarget.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
        const primary = await XlPrimarySales.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
        const users = await XlUser.findAll({ limit: 10 });
        res.json({ targets, primary, users });
    } catch(e) {
        res.json({ error: e.message });
    }
});
module.exports = router;
`;

c = c.replace(/module\.exports = router;/, debugRoute);
fs.writeFileSync('routes/xl.js', c);
console.log('Added debug route');
