const db = require('../db');

async function checkDummies() {
    console.log('--- CHECKING onboard_applicants ---');
    const apps = await db.Applicant.find({});
    console.table(apps.map(a => ({ _id: a._id, fullName: a.fullName, email: a.email, mobile: a.mobileNumber || a.phone || a.mobile, status: a.status })));

    console.log('--- CHECKING onboard_applicants_backup ---');
    const [backups] = await db.sequelize.query('SELECT * FROM onboard_applicants_backup');
    console.log('Total backup rows:', backups.length);
    const backupParsed = backups.map(r => {
        try { return JSON.parse(r.docData); } catch(e) { return r; }
    });
    const dummyBackups = backupParsed.filter(a => 
        (a.email && (a.email.toLowerCase().includes('test') || a.email.toLowerCase().includes('example.com') || a.email.toLowerCase().includes('briskheal') || a.email.toLowerCase().includes('dummy'))) ||
        (a.fullName && (a.fullName.toLowerCase().includes('test') || a.fullName.toLowerCase().includes('brisk') || a.fullName.toLowerCase().includes('dummy')))
    );
    console.log('Dummy backup rows found:', dummyBackups.length);
    if (dummyBackups.length > 0) {
        console.table(dummyBackups.slice(0, 15).map(a => ({ fullName: a.fullName, email: a.email, status: a.status })));
    }

    console.log('--- CHECKING onboard_companies ---');
    const companies = await db.Company.find({});
    console.table(companies.map(c => ({ _id: c._id, companyName: c.companyName, email: c.email })));

    process.exit(0);
}

checkDummies().catch(err => {
    console.error('Crash:', err);
    process.exit(1);
});
