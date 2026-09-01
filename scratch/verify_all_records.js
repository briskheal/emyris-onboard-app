const db = require('../db');

async function verifyAll() {
    console.log('--- ALL ONBOARD_APPLICANTS ---');
    const apps = await db.Applicant.find({});
    apps.forEach(a => {
        console.log(`Active: [${a._id}] ${a.fullName} (${a.email}) - status: ${a.status}`);
    });

    console.log('--- ALL ONBOARD_APPLICANTS_BACKUP ---');
    const [backups] = await db.sequelize.query('SELECT * FROM onboard_applicants_backup');
    backups.forEach((r, idx) => {
        let doc = {};
        try { doc = JSON.parse(r.docData); } catch(e) {}
        console.log(`Backup #${idx+1}: ${doc.fullName || r.fullName} (${doc.email || r.email}) - status: ${doc.status || r.status}`);
    });

    console.log('--- ALL ONBOARD_EXAM_RESULTS ---');
    const results = await db.ExamResult.find({});
    results.forEach(r => {
        console.log(`Result: ${r.fullName} (${r.email}) - product: ${r.testedProduct}`);
    });

    process.exit(0);
}

verifyAll().catch(e => { console.error(e); process.exit(1); });
