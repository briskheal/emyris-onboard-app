const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = "mongodb+srv://impdaysaap:RPykhDyaiPDFwSJi@cluster0.cquys3i.mongodb.net/emyris_db?appName=Cluster0";

async function checkMongo() {
    console.log('🔍 Connecting to MongoDB...');
    try {
        await mongoose.connect(MONGODB_URI, { family: 4 });
        console.log('✅ Connected successfully to MongoDB!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📦 Collections found:');
        
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        console.log('\n✅ DB Check Complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
}

checkMongo();
