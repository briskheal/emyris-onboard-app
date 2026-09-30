const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const routeStr = `
// --- DASHBOARD STATS ROUTE ---
router.get('/admin/dashboard-stats', async (req, res) => {
    try {
        const { XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlUser, XlCallPlan, Sequelize } = require('../db');
        const { Op } = Sequelize;
        
        let { month, year, employeeId } = req.query;
        if (!month || !year) {
            const date = new Date();
            const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            month = month || months[date.getMonth()];
            year = year || String(date.getFullYear());
        }
        
        let whereUser = {};
        if (employeeId) {
            whereUser.employeeId = employeeId;
        }

        let targetSum = 0;
        const targets = await XlTarget.findAll({ where: { month, year, ...whereUser } });
        targets.forEach(t => {
            targetSum += (parseFloat(t.totalProductAmount) || 0) + (parseFloat(t.lumpSumAmount) || 0);
        });

        let primarySum = 0;
        const primary = await XlPrimarySales.findAll({ where: { month, year, ...whereUser } });
        primary.forEach(p => {
            primarySum += (parseFloat(p.netInvValue) || parseFloat(p.amount) || 0);
        });

        let secondarySum = 0;
        const secondary = await XlSecondarySales.findAll({ where: { month, year, ...whereUser } });
        secondary.forEach(s => {
            secondarySum += (parseFloat(s.amount) || 0);
        });

        const monthNum = String(["January","February","March","April","May","June","July","August","September","October","November","December"].indexOf(month) + 1).padStart(2, '0');
        const datePrefix = \`\${year}-\${monthNum}-\`;
        
        const dcrs = await XlDCR.findAll({ 
            where: { 
                date: { [Op.like]: \`\${datePrefix}%\` }, 
                ...whereUser 
            } 
        });

        let doctorCalls = 0;
        let chemistCalls = 0;
        let stockistCalls = 0;

        dcrs.forEach(d => {
            if (d.entityType === 'Doctor') doctorCalls++;
            else if (d.entityType === 'Chemist') chemistCalls++;
            else if (d.entityType === 'Stockist') stockistCalls++;
        });

        let targetDoctorCalls = 0;
        let targetChemistCalls = 0;
        let targetStockistCalls = 0;
        
        const callPlans = await XlCallPlan.findAll({
            where: {
                date: { [Op.like]: \`\${datePrefix}%\` },
                ...whereUser
            }
        });

        callPlans.forEach(cp => {
            try { targetDoctorCalls += JSON.parse(cp.doctors || '[]').length; } catch(e) {}
            try { targetChemistCalls += JSON.parse(cp.chemists || '[]').length; } catch(e) {}
            try { targetStockistCalls += JSON.parse(cp.stockists || '[]').length; } catch(e) {}
        });

        res.json({
            success: true,
            data: {
                target: targetSum,
                primary: primarySum,
                secondary: secondarySum,
                calls: {
                    doctor: { actual: doctorCalls, target: targetDoctorCalls },
                    chemist: { actual: chemistCalls, target: targetChemistCalls },
                    stockist: { actual: stockistCalls, target: targetStockistCalls }
                }
            }
        });

    } catch(e) {
        console.error("Dashboard Stats Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
`;

c = c.replace(/module\.exports = router;/, routeStr);
fs.writeFileSync('routes/xl.js', c);
console.log('Added dashboard stats route');
