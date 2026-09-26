const { XlLeave, XlAttendance, XlUser, sequelize } = require('./db');

async function check() {
    try {
        console.log("Checking XlLeave...");
        const leaves = await XlLeave.findAll({ 
            where: { startDate: '2026-09-24' },
            raw: true
        });
        console.log(leaves);

        console.log("Checking XlAttendance...");
        const atts = await XlAttendance.findAll({
            where: { date: '2026-09-24' },
            raw: true
        });
        console.log(atts);
        
        console.log("Checking Users...");
        const users = await XlUser.findAll({ raw: true });
        const alfez = users.filter(u => u.employeeId === 'EMYFE118' || (u.email && u.email.includes('alfez')));
        console.log(alfez);
    } catch(e) {
        console.error(e);
    }
}
check();
