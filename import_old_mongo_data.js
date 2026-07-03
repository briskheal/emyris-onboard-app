const fs = require('fs');
const { Applicant, Company, Division, HQ, syncDatabase } = require('./db');

async function importData() {
    console.log('🚀 Starting MongoDB to PostgreSQL Data Restoration...');
    await syncDatabase();

    if (!fs.existsSync('mongodb_backup_full.json')) {
        console.error('❌ File mongodb_backup_full.json not found!');
        process.exit(1);
    }

    const raw = fs.readFileSync('mongodb_backup_full.json', 'utf8');
    const data = JSON.parse(raw);

    let importedApps = 0;
    const apps = data.applicants || [];
    console.log(`Processing ${apps.length} applicants...`);
    for (const app of apps) {
        delete app.__v;
        if (app._id && typeof app._id === 'object') app._id = app._id.$oid || app._id.toString();
        const existing = await Applicant.findOne({ email: app.email });
        if (existing) {
            await existing.update(app);
        } else {
            await Applicant.create(app);
        }
        importedApps++;
    }
    console.log(`✅ Restored ${importedApps} Applicants.`);

    if (data.companies && data.companies.length > 0) {
        const comp = data.companies[0];
        delete comp.__v;
        if (comp._id && typeof comp._id === 'object') comp._id = comp._id.$oid || comp._id.toString();
        const existing = await Company.findOne({});
        if (existing) {
            await existing.update(comp);
        } else {
            await Company.create(comp);
        }
        console.log('✅ Restored Company Configuration.');
    }

    if (data.divisions && data.divisions.length > 0) {
        for (const d of data.divisions) {
            delete d.__v;
            if (d._id && typeof d._id === 'object') d._id = d._id.$oid || d._id.toString();
            const existing = await Division.findOne({ name: d.name });
            if (!existing && d.name) await Division.create(d);
        }
        console.log(`✅ Restored ${data.divisions.length} Divisions.`);
    }

    if (data.hqs && data.hqs.length > 0) {
        for (const h of data.hqs) {
            delete h.__v;
            if (h._id && typeof h._id === 'object') h._id = h._id.$oid || h._id.toString();
            const existing = await HQ.findOne({ name: h.name });
            if (!existing && h.name) await HQ.create(h);
        }
        console.log(`✅ Restored ${data.hqs.length} HQs.`);
    }

    console.log('🎉 Migration Complete!');
    process.exit(0);
}

importData().catch(err => {
    console.error('❌ Migration Error:', err);
    process.exit(1);
});
