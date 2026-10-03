const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const debugCode = `
router.get('/admin/debug-data', async (req, res) => {
    try {
        const { XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlUser, XlCallPlan } = require('../db');
        const { Op } = require('sequelize');
        
        let month = 'Sep';
        let year = '2026';
        let employeeId = undefined; // Admin view
        let whereUser = {};

        const allMonthsFull = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const allMonthsShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        let fullM = month;
        let shortM = month;
        let mm = 0;
        let sIdx = allMonthsShort.indexOf(month);
        if (sIdx !== -1) {
            fullM = allMonthsFull[sIdx];
            mm = sIdx + 1;
        }
        
        let mmStr1 = String(mm).padStart(2, '0');
        let mmStr2 = String(mm);
        
        const monthVariants = [month, fullM, shortM, mmStr1, mmStr2];
        const targets = await XlTarget.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });
        let targetSum = 0;
        targets.forEach(t => {
            targetSum += (parseFloat(t.totalProductAmount) || 0) + (parseFloat(t.lumpSumAmount) || 0);
        });

        const monthNum = String(mm).padStart(2, '0');
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
        
        let workingDays = 0;
        const mInt = parseInt(monthNum, 10);
        const yInt = parseInt(year, 10);
        if (!isNaN(mInt) && !isNaN(yInt)) {
            const daysInMonth = new Date(yInt, mInt, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const dt = new Date(yInt, mInt - 1, d);
                if (dt.getDay() !== 0) workingDays++; // Not a Sunday
            }
            const holidays = await require('../db').XlHoliday.count({
                where: { date: { [Op.like]: \`\${year}-\${monthNum}-%\` } }
            });
            workingDays -= holidays;
            if (workingDays < 0) workingDays = 0;
        }

        const allUsers = await XlUser.findAll({ 
            where: { status: 'Active' },
            attributes: ['designation']
        });
        const allDesigs = await require('../db').XlDesignation.findAll();
        const desigMap = {};
        allDesigs.forEach(d => {
            desigMap[d._id] = d;
            if (d.designationName) desigMap[d.designationName] = d;
        });

        allUsers.forEach(u => {
            if (u.designation && desigMap[u.designation]) {
                const desig = desigMap[u.designation];
                let dT = 0, cT = 0, sT = 0;
                if (desig.targetDoctorCalls) dT = desig.targetDoctorCalls;
                else {
                    if (desig.level === 1 || desig.level === 2) dT = 8;
                    else if (desig.level === 3 || desig.level === 4) dT = 6;
                    else if (desig.level >= 5) dT = 5;
                }
                if (desig.targetChemistCalls) cT = desig.targetChemistCalls;
                if (desig.targetStockistCalls) sT = desig.targetStockistCalls;

                targetDoctorCalls += workingDays * dT;
                targetChemistCalls += workingDays * cT;
                targetStockistCalls += workingDays * sT;
            }
        });

        res.json({
            success: true,
            data: {
                target: targetSum,
                calls: {
                    doctor: { actual: doctorCalls, target: targetDoctorCalls },
                    chemist: { actual: chemistCalls, target: targetChemistCalls },
                    stockist: { actual: stockistCalls, target: targetStockistCalls }
                },
                debug: {
                    workingDays,
                    usersCount: allUsers.length
                }
            }
        });

    } catch(e) {
        res.status(500).json({ success: false, error: e.message, stack: e.stack });
    }
});
`;

c = c.replace(/router\.get\('\/admin\/debug-data', async \(req, res\) => \{[\s\S]*?module\.exports = router;/m, debugCode + '\nmodule.exports = router;');
fs.writeFileSync('routes/xl.js', c);
