const { XlAttendance, XlUser, XlLeave } = require('./db');
const { Op } = require('sequelize');

async function check() {
    // Mohammad Kachhi
    const u = await XlUser.findOne({ where: { firstName: 'Mohammad', lastName: 'Kachhi' } });
    if (!u) {
        console.log("No Kachhi");
        return;
    }
    console.log("User:", u.employeeId, u.email, u.uid);

    const atts = await XlAttendance.findAll({
        where: {
            employeeId: { [Op.in]: [u.employeeId, u.email, u.uid] },
            date: { [Op.like]: '2026-09-%' }
        },
        raw: true
    });
    console.log("Attendances:", atts.map(a => ({ date: a.date, status: a.status })));
    
    const leaves = await XlLeave.findAll({
        where: {
            employeeId: { [Op.in]: [u.employeeId, u.email, u.uid] },
            startDate: { [Op.like]: '2026-09-%' }
        },
        raw: true
    });
    console.log("Leaves:", leaves.map(l => ({ start: l.startDate, end: l.endDate, status: l.status })));
}
check();
