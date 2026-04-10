const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
// Fallback logic matches server.js
const MONGODB_ASSETS_URI = process.env.MONGODB_ASSETS_URI || (MONGODB_URI ? MONGODB_URI.split('?')[0] + '_assets?' + (MONGODB_URI.split('?')[1] || '') : null);

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is required in .env');
    process.exit(1);
}

const dbOptions = { family: 4 };

async function migrate() {
    console.log('🚀 Starting Applicant Document Migration...');
    console.log('🔗 Main DB:', MONGODB_URI.split('@')[1] || 'Localhost');
    console.log('🔗 Asset DB:', MONGODB_ASSETS_URI.split('@')[1] || 'Localhost');

    const connMain = mongoose.createConnection(MONGODB_URI, dbOptions);
    const connAssets = mongoose.createConnection(MONGODB_ASSETS_URI, dbOptions);

    const assetSchema = new mongoose.Schema({
        category: String,
        name: String,
        data: String,
        active: { type: Boolean, default: true },
        uploadedAt: { type: Date, default: Date.now }
    });

    const applicantSchema = new mongoose.Schema({
        email: String,
        documents: { type: [mongoose.Schema.Types.Mixed], default: [] }
    });

    const Applicant = connMain.model('Applicant', applicantSchema);
    const Asset = connAssets.model('Asset', assetSchema);

    try {
        await Promise.all([
            new Promise(res => connMain.once('open', res)),
            new Promise(res => connAssets.once('open', res))
        ]);
        console.log('✅ Connected to both databases.');

        const applicants = await Applicant.find({ 'documents.data': { $exists: true } });
        console.log(`🔍 Found ${applicants.length} applicants with legacy embedded documents.`);

        let migratedCount = 0;
        let fileCount = 0;

        for (const app of applicants) {
            let changed = false;
            console.log(`📦 Processing: ${app.email}...`);

            const updatedDocs = [];
            for (const doc of app.documents) {
                if (doc.data && !doc.assetId) {
                    // Migrate file to Asset DB
                    const newAsset = new Asset({
                        category: `doc_${doc.category}`,
                        name: doc.name || 'document',
                        data: doc.data,
                        active: true,
                        uploadedAt: doc.uploadedAt || new Date()
                    });
                    const savedAsset = await newAsset.save();
                    
                    // Create metadata-only version
                    const metadata = { ...doc };
                    delete metadata.data;
                    metadata.assetId = savedAsset._id;
                    metadata.migrated = true;
                    
                    updatedDocs.push(metadata);
                    fileCount++;
                    changed = true;
                } else {
                    updatedDocs.push(doc);
                }
            }

            if (changed) {
                app.documents = updatedDocs;
                app.markModified('documents');
                await app.save();
                migratedCount++;
                console.log(`   ✅ Migrated ${app.email} documents strings removed.`);
            }
        }

        console.log('\n--- MIGRATION SUMMARY ---');
        console.log(`👥 Applicants Updated: ${migratedCount}`);
        console.log(`📄 Documents Moved:    ${fileCount}`);
        console.log('-------------------------\n');

        console.log('✅ Migration Job Finished.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Critical Error:', err);
        process.exit(1);
    }
}

migrate();
