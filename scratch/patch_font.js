const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres://postgres:12345@localhost:5432/emyris_onboard_db', {
    logging: false
});

async function run() {
    try {
        await sequelize.authenticate();
        await sequelize.query('ALTER TABLE onboard_companies ALTER COLUMN "letterFontSize" TYPE VARCHAR(255);');
        console.log('Altered letterFontSize to VARCHAR successfully.');
    } catch (e) {
        console.error('Migration error:', e);
    }
    process.exit(0);
}

run();
