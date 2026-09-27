const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = "mongodb+srv://impdaysaap:RPykhDyaiPDFwSJi@cluster0.cquys3i.mongodb.net/emyris_db?appName=Cluster0";
const MONGODB_ASSETS_URI = MONGODB_URI.split('?')[0] + '_assets?' + (MONGODB_URI.split('?')[1] || '');

async function checkBothDBs() {
    console.log('🔍 Checking Main DB:', MONGODB_URI);
    console.log('🔍 Checking Assets DB:', MONGODB_ASSETS_URI);

    try {
        const connMain = await mongoose.createConnection(MONGODB_URI).asPromise();
        const mainCols = await connMain.db.listCollections().toArray();
        console.log('\n📦 Main DB Collections:');
        for (const col of mainCols) {
            const count = await connMain.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count}`);
        }

        const connAssets = await mongoose.createConnection(MONGODB_ASSETS_URI).asPromise();
        const assetCols = await connAssets.db.listCollections().toArray();
        console.log('\n💎 Assets DB Collections:');
        if (assetCols.length === 0) {
            console.log('(No collections found in Assets DB)');
        }
        for (const col of assetCols) {
            const count = await connAssets.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkBothDBs();
