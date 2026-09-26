const { XlTourProgram, sequelize } = require('./db');
async function check() {
    const tps = await XlTourProgram.findAll({ where: { month: 'september', year: '2026' }, raw: true });
    console.log(tps.map(t => ({ id: t._id, employeeId: t.employeeId, month: t.month })));
}
check();
