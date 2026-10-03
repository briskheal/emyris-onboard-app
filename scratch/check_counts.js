const db = require('../db');

async function check() {
    const [tables] = await db.sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
    for (const t of tables) {
        const [rows] = await db.sequelize.query(`SELECT count(*) as c FROM "${t.name}"`);
        console.log(`${t.name}: ${rows[0].c}`);
    }
    process.exit(0);
}

check();
