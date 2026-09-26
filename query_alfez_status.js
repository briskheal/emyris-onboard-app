const { XlLeave, XlAttendance } = require('./db');

async function check() {
    const leaves = await XlLeave.findAll({ where: { employeeId: 'alfezkachchi007@gmail.com' }, order: [['createdAt', 'DESC']] });
    console.log("LEAVES:", leaves.map(l => ({ id: l._id, start: l.startDate, end: l.endDate, status: l.status })));
    
    const atts = await XlAttendance.findAll({ where: { employeeId: 'EMYFE118' } });
    console.log("ATTS:", atts.map(a => ({ id: a._id, date: a.date, status: a.status })));
}

check().catch(console.error);
