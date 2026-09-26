const db = require('../db');

async function deleteAllDummies() {
    console.log('--- INSPECTING ASSETS BEFORE DELETE ---');
    const [assets] = await db.sequelize.query('SELECT * FROM onboard_assets');
    console.log(`Found ${assets.length} total asset rows.`);
    if (assets.length > 0) {
        console.log('Sample asset row keys:', Object.keys(assets[0]));
    }

    console.log('--- DELETING DUMMY APPLICANTS FROM onboard_applicants ---');
    const appsBefore = await db.Applicant.find({});
    for (const a of appsBefore) {
        await db.Applicant.deleteOne({ _id: a._id });
        console.log(`Deleted applicant: ${a.fullName} (${a.email})`);
    }

    console.log('--- DELETING DUMMY RECORDS FROM onboard_applicants_backup ---');
    await db.sequelize.query('DELETE FROM onboard_applicants_backup');
    console.log('Cleared onboard_applicants_backup table.');

    console.log('--- DELETING DUMMY ASSETS ---');
    for (const asset of assets) {
        let doc = {};
        try { doc = JSON.parse(asset.docData); } catch(e) { doc = asset; }
        const email = doc.email || asset.email || '';
        if (email.includes('test') || email.includes('@example.com') || email.includes('@a.c') || !email) {
            await db.sequelize.query(`DELETE FROM onboard_assets WHERE _id = '${asset._id}'`);
            console.log(`Deleted dummy asset: ${asset._id} (${email})`);
        }
    }

    console.log('--- DELETING DUMMY EXAM RESULTS ---');
    await db.sequelize.query('DELETE FROM onboard_exam_results WHERE email LIKE "%test%" OR email LIKE "%@example.com%" OR email LIKE "%@a.c%" OR email IS NULL OR email = ""');
    console.log('Cleared dummy exam results.');

    console.log('--- VERIFYING CLEAN STATE ---');
    const appsAfter = await db.Applicant.find({});
    const [backupsAfter] = await db.sequelize.query('SELECT count(*) as c FROM onboard_applicants_backup');
    const [assetsAfter] = await db.sequelize.query('SELECT count(*) as c FROM onboard_assets');

    console.log(`Active Applicants remaining: ${appsAfter.length}`);
    console.log(`Backup Applicants remaining: ${backupsAfter[0].c}`);
    console.log(`Assets remaining: ${assetsAfter[0].c}`);

    process.exit(0);
}

deleteAllDummies().catch(err => {
    console.error('Error deleting dummies:', err);
    process.exit(1);
});
