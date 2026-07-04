const { MongoClient } = require('mongodb');
const { Sequelize, DataTypes } = require('sequelize');

const MONGODB_URI = "mongodb://impdaysaap:RPykhDyaiPDFwSJi@ac-4mjmqyy-shard-00-00.cquys3i.mongodb.net:27017,ac-4mjmqyy-shard-00-01.cquys3i.mongodb.net:27017,ac-4mjmqyy-shard-00-02.cquys3i.mongodb.net:27017/emyris_db_assets?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const POSTGRES_URI = "postgresql://neondb_owner:npg_3FUj8JmzDeLi@ep-wild-firefly-aore0r4s-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sequelize = new Sequelize(POSTGRES_URI, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { rejectUnauthorized: false } }
});

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const OnboardAsset = sequelize.define('onboard_asset', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    category: DataTypes.STRING,
    name: DataTypes.STRING,
    data: DataTypes.TEXT,
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

async function run() {
    let mongoClient;
    try {
        console.log("Connecting to PostgreSQL...");
        await sequelize.authenticate();
        await OnboardAsset.sync();
        console.log("PostgreSQL Connected!");

        console.log("Connecting to MongoDB (Assets DB)...");
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        console.log("MongoDB Connected!");

        const db = mongoClient.db('emyris_db_assets');
        const assetsCollection = db.collection('assets');

        const totalAssets = await assetsCollection.countDocuments();
        console.log(`Found ${totalAssets} assets in MongoDB.`);

        const cursor = assetsCollection.find({});
        let migratedCount = 0;
        let skippedCount = 0;

        for await (const asset of cursor) {
            const assetId = asset._id.toString();
            
            const existing = await OnboardAsset.findOne({ where: { _id: assetId } });
            if (!existing) {
                await OnboardAsset.create({
                    _id: assetId,
                    category: asset.category,
                    name: asset.name,
                    data: asset.data,
                    active: asset.active,
                    uploadedAt: asset.uploadedAt ? new Date(asset.uploadedAt) : new Date()
                });
                migratedCount++;
                console.log(`Migrated asset: ${asset.name} (${asset.category})`);
            } else {
                skippedCount++;
            }
        }

        console.log(`\n🎉 DONE! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        if (mongoClient) await mongoClient.close();
        await sequelize.close();
    }
}

run();
