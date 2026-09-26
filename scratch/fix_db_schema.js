const { sequelize } = require('../db');

async function fixSchema() {
    try {
        console.log('Syncing database to add missing columns...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database schema updated successfully!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed to update schema:', e);
        process.exit(1);
    }
}
fixSchema();
