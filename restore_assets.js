const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');

const dbUrl = 'postgresql://neondb_owner:npg_3FUj8JmzDeLi@ep-wild-firefly-aore0r4s-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sequelize = new Sequelize(dbUrl, {
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

async function restoreAssets() {
    try {
        await sequelize.authenticate();
        console.log('Connected to NeonDB PostgreSQL.');
        
        const raw = fs.readFileSync('./mongodb_backup_full.json', 'utf8');
        const data = JSON.parse(raw);
        const assets = data.assets || [];
        
        console.log(`Found ${assets.length} assets in MongoDB backup.`);
        
        let restoredCount = 0;
        let skippedCount = 0;
        
        for (const asset of assets) {
            let assetId = asset._id;
            if (assetId && typeof assetId === 'object') {
                assetId = assetId.$oid || assetId.toString();
            }
            
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
                restoredCount++;
                if (restoredCount % 10 === 0) console.log(`Restored ${restoredCount}...`);
            } else {
                skippedCount++;
            }
        }
        
        console.log(`🎉 Asset Restore Complete! Restored: ${restoredCount}, Skipped (already exist): ${skippedCount}`);
    } catch (err) {
        console.error('Failed:', err);
    } finally {
        await sequelize.close();
    }
}

restoreAssets();
