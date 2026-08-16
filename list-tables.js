const { sequelize } = require('./db.js');
async function run() {
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log(results);
}
run().catch(console.error);
