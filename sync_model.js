const { sequelize } = require('./db');
const { XlAnnouncement } = require('./models/xlModels')(sequelize);

async function syncModels() {
    try {
        await XlAnnouncement.sync({ alter: true });
        console.log('XlAnnouncement table created successfully.');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
syncModels();
