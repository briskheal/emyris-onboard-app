const { sequelize } = require('./db.js');
async function run() {
    try {
        await sequelize.sync({ alter: true });
        console.log("Database schema altered successfully! All missing columns added.");
    } catch (e) {
        console.error("Error altering schema:", e);
    }
    process.exit(0);
}
run();
