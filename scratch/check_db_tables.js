const { sequelize } = require('../db');
async function run() {
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('TABLES:', tables);
    for (let t of tables) {
        const [rows] = await sequelize.query(`SELECT count(*) as count FROM ${t.name}`);
        console.log(t.name, rows[0].count);
    }
}
run();
