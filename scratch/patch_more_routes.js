const fs = require('fs');
let code = fs.readFileSync('routes/xl.js', 'utf8');
const newRoutes = `
// Reports Route for Gifts List
router.get('/reports/gifts', async (req, res) => {
    try {
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) where.employeeId = employeeId;
        const records = await XlGift.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch gifts for reports' });
    }
});

// Reports Route for Routes List
router.get('/reports/routes', async (req, res) => {
    try {
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) where.employeeId = employeeId;
        const records = await XlRoute.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch routes for reports' });
    }
});
`;
code = code.replace("router.get('/reports/locations'", newRoutes + "\nrouter.get('/reports/locations'");
fs.writeFileSync('routes/xl.js', code);
console.log('Added more report routes');
