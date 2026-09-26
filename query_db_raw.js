const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'D:/MY WORK FLOW/Emyris Onboard App/database.sqlite', logging: false });

async function run() {
    const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';", { type: Sequelize.QueryTypes.SELECT });
    console.log(tables.map(t => t.name));
}
run();
