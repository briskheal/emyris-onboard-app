const { XlUser, XlDCR, XlAttendance } = require('./db.js');

async function run() {
    const kacchi = await XlUser.findOne({ where: { employeeId: 'KAC' } });
    if (kacchi) {
        console.log('User:', kacchi.employeeId, kacchi.email);
    } else {
        const u2 = await XlUser.findAll();
        u2.forEach(u => console.log(u.employeeId, u.email, u.firstName, u.lastName));
        return;
    }
}
run().catch(console.error);
