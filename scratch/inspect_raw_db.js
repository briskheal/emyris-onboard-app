const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('sqlite:./onboarding_fallback.sqlite', { logging: false });

async function inspect() {
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tables in onboarding_fallback.sqlite:");
    for (const t of tables) {
        if (t.name.startsWith('sqlite_')) continue;
        const [rows] = await sequelize.query(`SELECT COUNT(*) as cnt FROM "${t.name}"`);
        console.log(` - ${t.name}: ${rows[0].cnt} rows`);
    }
}
inspect().catch(console.error);
