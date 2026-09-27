const db = require('../db');

async function check() {
    const [backupRows] = await db.sequelize.query('SELECT registeredAt, submittedAt, status FROM onboard_applicants_backup');
    const countsByMonth = {};
    backupRows.forEach(r => {
        const d = r.submittedAt || r.registeredAt;
        const date = d ? new Date(d) : new Date();
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        countsByMonth[key] = (countsByMonth[key] || 0) + 1;
    });
    console.log('Backup Total Rows:', backupRows.length);
    console.log('Backup By Month:', countsByMonth);

    const [currentRows] = await db.sequelize.query('SELECT registeredAt, submittedAt, status FROM onboard_applicants');
    console.log('Current Table Rows:', currentRows.length);
    process.exit(0);
}

check();
