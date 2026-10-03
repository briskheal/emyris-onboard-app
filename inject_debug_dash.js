const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const debugRoute = `
router.get('/debug-dash-real', async (req, res) => {
    try {
        const { XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlUser, XlCallPlan } = require('../db');
        const { Op } = require('sequelize');
        const month = 'Sep';
        const year = '2026';
        
        let targetSum = 0;
        let primarySalesSum = 0;
        let secondarySalesSum = 0;

        let doctorCalls = 0;
        let chemistCalls = 0;
        let stockistCalls = 0;

        let targetDoctorCalls = 0;
        let targetChemistCalls = 0;
        let targetStockistCalls = 0;

        let targetPrimarySales = 0;
        let targetSecondarySales = 0;

        const allMonthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const allMonthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        let fullM = month, shortM = month, mm = 1;

        let sIdx = allMonthsShort.indexOf(month);
        if (sIdx !== -1) {
            fullM = allMonthsFull[sIdx];
            mm = sIdx + 1;
        } else {
            let fIdx = allMonthsFull.indexOf(month);
            if (fIdx !== -1) {
                shortM = allMonthsShort[fIdx];
                mm = fIdx + 1;
            } else {
                mm = parseInt(month);
                if (mm > 0 && mm <= 12) {
                    shortM = allMonthsShort[mm - 1];
                    fullM = allMonthsFull[mm - 1];
                }
            }
        }

        let mmStr1 = String(mm).padStart(2, '0');
        let mmStr2 = String(mm);

        const monthVariants = [month, fullM, shortM, mmStr1, mmStr2];

        const targets = await XlTarget.findAll({ where: { month: { [Op.in]: monthVariants }, year } });
        targets.forEach(t => {
            targetSum += (parseFloat(t.totalProductAmount) || 0) + (parseFloat(t.lumpSumAmount) || 0);
        });

        const monthNum = String(allMonthsShort.indexOf(shortM) + 1).padStart(2, '0');
        const datePrefix = \`\${year}-\${monthNum}-\`;

        const pSales = await XlPrimarySales.findAll({ where: { date: { [Op.like]: \`\${datePrefix}%\` } } });
        pSales.forEach(s => primarySalesSum += parseFloat(s.amount) || 0);

        const sSales = await XlSecondarySales.findAll({ where: { month: { [Op.in]: monthVariants }, year } });
        sSales.forEach(s => secondarySalesSum += parseFloat(s.amount) || 0);

        const dcrs = await XlDCR.findAll({ where: { date: { [Op.like]: \`\${datePrefix}%\` } } });
        dcrs.forEach(d => {
            if (d.entityType === 'Doctor') doctorCalls++;
            else if (d.entityType === 'Chemist') chemistCalls++;
            else if (d.entityType === 'Stockist') stockistCalls++;
        });

        // ADMIN VIEW CALCULATION
        const allUsers = await XlUser.findAll({ where: { status: 'Active' }, attributes: ['designation'] });
        const allDesigs = await require('../db').XlDesignation.findAll();
        const desigMap = {};
        allDesigs.forEach(d => {
            desigMap[d._id] = d;
            if (d.designationName) desigMap[d.designationName] = d;
        });

        const today = new Date();
        const y = parseInt(year);
        const m = parseInt(monthNum);
        let daysInMonth = new Date(y, m, 0).getDate();
        
        let startDay = 1;
        let endDay = daysInMonth;

        if (y === today.getFullYear() && m === today.getMonth() + 1) {
            endDay = today.getDate();
        } else if (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth() + 1)) {
            endDay = 0;
        }

        let workingDays = 0;
        for (let d = startDay; d <= endDay; d++) {
            const dt = new Date(y, m - 1, d);
            if (dt.getDay() !== 0) {
                workingDays++;
            }
        }

        const holidays = await require('../db').XlHoliday.count({
            where: { date: { [Op.like]: \`\${datePrefix}%\` } }
        });
        workingDays -= holidays;
        if (workingDays < 0) workingDays = 0;

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

        targetPrimarySales = targetSum;
        targetSecondarySales = targetSum;

        res.json({
            success: true,
            data: {
                target: targetSum,
                primary: primarySalesSum,
                secondary: secondarySalesSum,
                calls: {
                    doctor: { target: targetDoctorCalls, actual: doctorCalls },
                    chemist: { target: targetChemistCalls, actual: chemistCalls },
                    stockist: { target: targetStockistCalls, actual: stockistCalls }
                },
                sales: {
                    primary: { target: targetPrimarySales, actual: primarySalesSum },
                    secondary: { target: targetSecondarySales, actual: secondarySalesSum }
                }
            }
        });

    } catch (e) {
        res.status(500).json({ success: false, error: e.message, stack: e.stack });
    }
});
`;

c = c.replace('module.exports = router;', debugRoute + '\nmodule.exports = router;');
fs.writeFileSync('routes/xl.js', c);
