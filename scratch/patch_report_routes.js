const fs = require('fs');
let code = fs.readFileSync('routes/xl.js', 'utf8');
const newRoutes = `
// Reports Route for Chemists List
router.get('/reports/chemists', async (req, res) => {
    try {
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) where.employeeId = employeeId;
        const records = await XlChemist.findAll({ where, order: [['businessName', 'ASC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch chemists for reports' });
    }
});

// Reports Route for Stockists List
router.get('/reports/stockists', async (req, res) => {
    try {
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) where.employeeId = employeeId;
        const records = await XlStockist.findAll({ where, order: [['businessName', 'ASC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch stockists for reports' });
    }
});

// Reports Route for Products List
router.get('/reports/products', async (req, res) => {
    try {
        const records = await XlProduct.findAll({ order: [['productName', 'ASC']] });
        res.json({ success: true, data: records });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch products for reports' });
    }
});

// Reports Route for Locations List
router.get('/reports/locations', async (req, res) => {
    try {
        const { employeeId } = req.query;
        const doctors = await XlDoctor.findAll({ attributes: ['headquarter', 'workingArea', 'employeeId'] });
        const chemists = await XlChemist.findAll({ attributes: ['headquarter', 'workingArea', 'employeeId'] });
        const stockists = await XlStockist.findAll({ attributes: ['headquarter', 'workingArea', 'employeeId'] });
        
        res.json({ 
            success: true, 
            data: { doctors, chemists, stockists }
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch locations data for reports' });
    }
});
`;
code = code.replace("router.get('/doctors', async (req, res) => {", newRoutes + "\nrouter.get('/doctors', async (req, res) => {");
fs.writeFileSync('routes/xl.js', code);
console.log('Added report routes');
