const fs = require('fs');
let xl = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const debugRoute = `
router.get('/debug-leave', async (req, res) => {
    try {
        const { XlLeave, XlUser, XlAttendance } = require('../db');
        const leaves = await XlLeave.findAll({ order: [['createdAt', 'DESC']], limit: 5 });
        
        const debugInfo = [];
        for (const l of leaves) {
            let correctEmployeeId = l.employeeId;
            const xlUser = await XlUser.findOne({ where: { email: l.employeeId } });
            if (xlUser && xlUser.employeeId) {
                correctEmployeeId = xlUser.employeeId;
            }
            
            const atts = await XlAttendance.findAll({ where: { employeeId: correctEmployeeId, date: l.startDate } });
            debugInfo.push({
                leaveId: l._id,
                leaveEmp: l.employeeId,
                xlUserFound: !!xlUser,
                xlUserCode: xlUser ? xlUser.employeeId : null,
                correctEmployeeId,
                date: l.startDate,
                status: l.status,
                attExists: atts.length > 0,
                atts: atts.map(a => a.toJSON())
            });
        }
        res.json({ debugInfo });
    } catch(e) {
        res.json({ error: e.message, stack: e.stack });
    }
});
`;

if (!xl.includes('/debug-leave')) {
    xl = xl.replace("router.get('/attendance'", debugRoute + "\nrouter.get('/attendance'");
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', xl);
    console.log("Injected debug route!");
}
