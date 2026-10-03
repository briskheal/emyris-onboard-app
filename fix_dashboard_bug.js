const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const newRoute = `// --- DASHBOARD STATS ROUTE ---
router.get('/admin/dashboard-stats', async (req, res) => {
    try {
        const { XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlUser, XlCallPlan } = require('../db');
        const { Op } = require('sequelize');
        
        let { month, year, employeeId } = req.query;
        if (!month || !year) {
            const date = new Date();
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            month = month || months[date.getMonth()];
            year = year || String(date.getFullYear());
        }
        
        // Handle "undefined" string edge case
        if (employeeId === 'undefined' || employeeId === 'null') {
            employeeId = undefined;
        }

        let whereUser = {};
        if (employeeId) {
            const user = await XlUser.findOne({
                where: {
                    [Op.or]: [
                        { _id: employeeId },
                        { uid: employeeId },
                        { employeeId: employeeId }
                    ]
                }
            });
            if (user) {
                const userKeys = [user._id, user.uid, user.employeeId].filter(Boolean);
                whereUser.employeeId = { [Op.in]: userKeys };
            } else {
                whereUser.employeeId = employeeId;
            }
        }

        let targetSum = 0;
        const allMonthsFull = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const allMonthsShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        let fullM = month;
        let shortM = month;
        let mm = 0;
        
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
                mm = parseInt(month, 10);
                if (mm > 0 && mm <= 12) {
                    shortM = allMonthsShort[mm - 1];
                    fullM = allMonthsFull[mm - 1];
                }
            }
        }
        
        let mmStr1 = String(mm).padStart(2, '0');
        let mmStr2 = String(mm);
        
        // Broad date variants for targets & sales
        const monthVariants = [month, fullM, shortM, mmStr1, mmStr2];
        const targets = await XlTarget.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });
        targets.forEach(t => {
            targetSum += (parseFloat(t.totalProductAmount) || 0) + (parseFloat(t.lumpSumAmount) || 0);
        });

        let primarySum = 0;
        const primary = await XlPrimarySales.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });
        primary.forEach(p => {
            primarySum += (parseFloat(p.netInvValue) || parseFloat(p.amount) || 0);
        });

        let secondarySum = 0;
        const secondary = await XlSecondarySales.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });
        secondary.forEach(s => {
            secondarySum += (parseFloat(s.amount) || 0);
        });

        const monthNum = String(mm).padStart(2, '0');
        const datePrefix = \`\${year}-\${monthNum}-\`; // YYYY-MM-DD
        const altDatePrefix = \`%-\${monthNum}-\${year}\`; // DD-MM-YYYY fallback
        
        const dcrs = await XlDCR.findAll({ 
            where: { 
                [Op.or]: [
                    { date: { [Op.like]: \`\${datePrefix}%\` } },
                    { date: { [Op.like]: altDatePrefix } }
                ],
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
        
        // Calculate working days safely
        if (!isNaN(mInt) && !isNaN(yInt) && mInt > 0) {
            try {
                const daysInMonth = new Date(yInt, mInt, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    const dt = new Date(yInt, mInt - 1, d);
                    if (dt.getDay() !== 0) workingDays++; // Not a Sunday
                }
                const holidays = await require('../db').XlHoliday.count({
                    where: {
                        [Op.or]: [
                            { date: { [Op.like]: \`\${datePrefix}%\` } },
                            { date: { [Op.like]: altDatePrefix } }
                        ]
                    }
                });
                workingDays -= holidays;
                if (workingDays < 0) workingDays = 0;
            } catch (e) {
                console.error("Holiday calculation error:", e);
                workingDays = 26; // Fallback to average working days
            }
        } else {
            workingDays = 26;
        }

        if (employeeId) {
            let dTargetPerDay = 0;
            let cTargetPerDay = 0;
            let sTargetPerDay = 0;
            const user = await XlUser.findOne({
                where: {
                    [Op.or]: [
                        { _id: employeeId },
                        { uid: employeeId },
                        { employeeId: employeeId }
                    ]
                }
            });
            if (user && user.designation) {
                const desig = await require('../db').XlDesignation.findOne({
                    where: {
                        [Op.or]: [
                            { _id: user.designation },
                            { designationName: user.designation }
                        ]
                    }
                });
                if (desig) {
                    if (desig.targetDoctorCalls) dTargetPerDay = desig.targetDoctorCalls;
                    else {
                        if (desig.level === 1 || desig.level === 2) dTargetPerDay = 8;
                        else if (desig.level === 3 || desig.level === 4) dTargetPerDay = 6;
                        else if (desig.level >= 5) dTargetPerDay = 5;
                    }
                    if (desig.targetChemistCalls) cTargetPerDay = desig.targetChemistCalls;
                    if (desig.targetStockistCalls) sTargetPerDay = desig.targetStockistCalls;
                }
            }
            targetDoctorCalls = workingDays * dTargetPerDay;
            targetChemistCalls = workingDays * cTargetPerDay;
            targetStockistCalls = workingDays * sTargetPerDay;

        } else {
            // ADMIN VIEW: Aggregate targets across all employees
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
        }

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
        // Ensure we ALWAYS return valid 200 format on catch so UI doesn't zero out completely if partial failure
        res.status(500).json({ 
            success: false, 
            message: e.message,
            data: {
                target: 0, primary: 0, secondary: 0,
                calls: { doctor: { actual: 0, target: 0 }, chemist: { actual: 0, target: 0 }, stockist: { actual: 0, target: 0 } }
            }
        });
    }
});

router.get('/admin/debug-data'`;

const startIdx = c.indexOf('// --- DASHBOARD STATS ROUTE ---');
const endIdx = c.indexOf("router.get('/admin/debug-data'", startIdx);
if (startIdx !== -1 && endIdx !== -1) {
    c = c.substring(0, startIdx) + newRoute + c.substring(endIdx + "router.get('/admin/debug-data'".length);
    fs.writeFileSync('routes/xl.js', c);
    console.log("Replaced dashboard stats route");
} else {
    console.error("Could not find boundaries");
}
