const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const targetLogic = `        let targetDoctorCalls = 0;
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
            // Subtract holidays
            const holidays = await require('../db').XlHoliday.count({
                where: {
                    date: { [Op.like]: \`\${year}-\${monthNum}-%\` }
                }
            });
            workingDays -= holidays;
            if (workingDays < 0) workingDays = 0;
        }

        let dTargetPerDay = 0;
        let cTargetPerDay = 0;
        let sTargetPerDay = 0;

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
        }

        targetDoctorCalls = workingDays * dTargetPerDay;
        targetChemistCalls = workingDays * cTargetPerDay;
        targetStockistCalls = workingDays * sTargetPerDay;`;

const regex = /let targetDoctorCalls = 0;[\s\S]*?const callPlans = await XlCallPlan\.findAll\(\{[\s\S]*?\}\);[\s\S]*?callPlans\.forEach\(cp => \{[\s\S]*?\}\);/m;

if (c.match(regex)) {
    c = c.replace(regex, targetLogic);
    fs.writeFileSync('routes/xl.js', c);
    console.log('Successfully patched dashboard targets in routes/xl.js');
} else {
    console.log('Regex failed to match');
}
