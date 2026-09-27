const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://emyrishr.in';
const EMAIL = 'aruns_yadav@yahoo.com';

async function run() {
    console.log(`Starting REVERSAL processing for ${EMAIL}...`);

    // 1. Fetch current live documents for Arun
    const appsRes = await fetch(`${BASE_URL}/api/admin/applicants`);
    const appsData = await appsRes.json();
    
    if (!appsData || !Array.isArray(appsData)) {
        console.error('Failed to fetch applicants:', appsData);
        return;
    }
    
    const liveArun = appsData.find(a => a.email === EMAIL);
    if (!liveArun) {
        console.error('Applicant Arun not found on live server!');
        return;
    }

    // 2. Delete all current (mistaken) documents on the live server
    const currentDocs = liveArun.documents || [];
    console.log(`Found ${currentDocs.length} current documents. Deleting them to prepare for restore...`);
    for (const doc of currentDocs) {
        const delRes = await fetch(`${BASE_URL}/api/admin/delete-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, assetId: doc.assetId })
        });
        const d = await delRes.json();
        console.log(`Deleted ${doc.category}:`, d);
    }

    // 3. Read the original backup seed to restore exactly what was there before
    const seedPath = path.join(__dirname, '../initial_hostycare_seed.json');
    if (!fs.existsSync(seedPath)) {
        console.error('Seed backup file not found. Cannot restore.');
        return;
    }
    
    console.log('Loading backup data to restore Arun...');
    const raw = fs.readFileSync(seedPath, 'utf8');
    const backupData = JSON.parse(raw);
    
    const backupArun = backupData.applicants.find(a => a.email === EMAIL);
    if (!backupArun || !backupArun.documents || backupArun.documents.length === 0) {
        console.log('No previous documents found in the backup for Arun to restore.');
        return;
    }

    const docsToRestore = backupArun.documents;
    console.log(`Found ${docsToRestore.length} original documents in backup. Restoring them...`);

    for (const doc of docsToRestore) {
        // Find the full asset data in the backup
        const asset = backupData.assets.find(a => {
            const aId = a._id && typeof a._id === 'object' ? (a._id.$oid || a._id.toString()) : a._id;
            return aId === doc.assetId;
        });

        if (!asset || !asset.data) {
            console.log(`Asset data missing for ${doc.name}, skipping...`);
            continue;
        }

        console.log(`Restoring ${doc.name} as [${doc.category}]...`);
        const upRes = await fetch(`${BASE_URL}/api/applicant/upload-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: EMAIL, 
                category: doc.category, 
                fileName: doc.name, 
                fileData: asset.data 
            })
        });
        const u = await upRes.json();
        console.log(`Restore result:`, u);
    }

    console.log(`\n🎉 FINISHED! Arun's files have been completely reversed and restored to their original state!`);
}

run();
