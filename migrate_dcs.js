const { sequelize } = require('./db');
const { Op } = require('sequelize');

async function migrate() {
    const XlUser = sequelize.models.xl_user;
    const XlDoctor = sequelize.models.xl_doctor;
    const XlChemist = sequelize.models.xl_chemist;
    const XlStockist = sequelize.models.xl_stockist;

    const users = await XlUser.findAll();
    const hqToEmpId = {};
    users.forEach(u => {
        if (u.hq && u.employeeId) {
            hqToEmpId[u.hq.toLowerCase()] = u.employeeId;
        }
    });

    console.log('HQ map:', hqToEmpId);

    for (let Model of [XlDoctor, XlChemist, XlStockist]) {
        const records = await Model.findAll({ where: { employeeId: null } });
        let updated = 0;
        for (let r of records) {
            if (r.headquarter || r.hq) {
                const hq = (r.headquarter || r.hq).toLowerCase();
                if (hqToEmpId[hq]) {
                    r.employeeId = hqToEmpId[hq];
                    await r.save();
                    updated++;
                }
            }
        }
        console.log(`Updated ${updated} records in ${Model.name}`);
    }
}

migrate().then(() => console.log('Done'));
