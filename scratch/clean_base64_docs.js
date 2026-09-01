const fs = require('fs');
const db = require('../db');

async function clean() {
    await db.syncDatabase();
    console.log("Connected to DB.");

    const applicants = await db.Applicant.find();
    let cleaned = 0;

    for (let app of applicants) {
        if (!app.documents) continue;

        const originalLength = app.documents.length;
        // Filter out any document where assetId is a base64 string or extremely long
        const cleanDocs = app.documents.filter(doc => {
            const assetId = String(doc.assetId || '');
            if (assetId.startsWith('data:image')) {
                console.log(`Found broken base64 document in ${app.email}: ${doc.category}`);
                return false;
            }
            if (assetId.length > 500) {
                console.log(`Found oversized assetId document in ${app.email}: ${doc.category}`);
                return false;
            }
            return true;
        });

        if (cleanDocs.length !== originalLength) {
            await db.Applicant.updateOne({ _id: app._id }, { $set: { documents: cleanDocs } });
            console.log(`Cleaned applicant ${app.email} (Removed ${originalLength - cleanDocs.length} broken docs)`);
            cleaned++;
        }
    }

    console.log(`Finished. Cleaned ${cleaned} applicants.`);
    process.exit(0);
}

clean().catch(console.error);
