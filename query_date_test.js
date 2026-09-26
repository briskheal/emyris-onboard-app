const { Sequelize, DataTypes, Op } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:', { logging: false });
const XlHoliday = sequelize.define('xl_holiday', { date: { type: DataTypes.DATEONLY } });

async function run() {
    await sequelize.sync();
    try {
        await XlHoliday.findAll({ where: { date: { [Op.between]: ['2026-09-01', '2026-09-31'] } } });
        console.log("SQLite allows it");
    } catch(e) {
        console.log("SQLite Error:", e.message);
    }
}
run();
