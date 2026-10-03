const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const replacement = `        let dTargetPerDay = 0;
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
            targetDoctorCalls = workingDays * dTargetPerDay;
            targetChemistCalls = workingDays * cTargetPerDay;
            targetStockistCalls = workingDays * sTargetPerDay;
        } else {
            // ADMIN VIEW: Aggregate targets across all employees
            const allUsers = await XlUser.findAll({ 
                where: { isActive: true },
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
        }`;

const regex = /let dTargetPerDay = 0;[\s\S]*?targetStockistCalls = workingDays \* sTargetPerDay;/m;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('routes/xl.js', c);
    console.log('Successfully patched admin targets');
} else {
    console.log('Regex failed');
}
