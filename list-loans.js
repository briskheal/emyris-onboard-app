const { sequelize } = require('./db.js');
async function run() {
    const [results] = await sequelize.query("SELECT * FROM onboard_assigned_loans;");
    console.log(results);
}
run().catch(console.error);
