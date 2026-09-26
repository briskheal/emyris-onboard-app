const { XlTourProgram, XlUser, sequelize } = require('./db');

async function check() {
    const user = await XlUser.findOne({ where: { employeeId: 'EMYFE118' } });
    if (!user) return console.log("User not found");
    
    const tps = await XlTourProgram.findAll({ 
        where: { 
            month: 'september', 
            year: '2026' 
        },
        raw: true 
    });
    
    const userTps = tps.filter(t => t.employeeId === user.employeeId || t.employeeId === user.email || t.employeeId === user.uid);
    console.log("User TPs for Sept 2026:");
    console.log(userTps.map(t => ({ id: t._id, empId: t.employeeId, status: t.status, length: t.entries ? t.entries.length : 0 })));
}
check();
