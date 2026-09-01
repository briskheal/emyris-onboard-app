const fs = require('fs');
let code = fs.readFileSync('routes/xl.js', 'utf8');
const newRoute = `
// Reports Route for Doctors List
router.get('/reports/doctors', async (req, res) => {
    try {
        const { employeeId } = req.query;
        let where = {};
        if (employeeId) where.employeeId = employeeId;
        const doctors = await XlDoctor.findAll({ where, order: [['name', 'ASC']] });
        res.json({ success: true, data: doctors });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch doctors for reports' });
    }
});
`;
code = code.replace("router.get('/doctors', async (req, res) => {", newRoute + "\nrouter.get('/doctors', async (req, res) => {");
fs.writeFileSync('routes/xl.js', code);
console.log('Added /reports/doctors route');
