const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('emyris', 'root', 'Jitu1234', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

const XlUser = sequelize.define('xl_user', {
    employeeId: { type: DataTypes.STRING },
    designation: { type: DataTypes.STRING },
    hq: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING },
    dailyAllowance: { type: DataTypes.FLOAT },
    exStationAllowance: { type: DataTypes.FLOAT },
    outStationAllowance: { type: DataTypes.FLOAT },
}, { freezeTableName: true });

const XlDesignation = sequelize.define('xl_designation', {
    designationName: { type: DataTypes.STRING },
    dailyAllowance: { type: DataTypes.FLOAT },
    exStationAllowance: { type: DataTypes.FLOAT },
    outStationAllowance: { type: DataTypes.FLOAT },
}, { freezeTableName: true });

async function check() {
    try {
        const users = await XlUser.findAll({ where: { employeeId: { [Op.ne]: null } } });
        console.log("Users:", users.map(u => ({ empId: u.employeeId, des: u.designation, uDaily: u.dailyAllowance, uEx: u.exStationAllowance })));
        
        const desgs = await XlDesignation.findAll();
        console.log("Designations:", desgs.map(d => ({ name: d.designationName, dDaily: d.dailyAllowance, dEx: d.exStationAllowance })));
    } catch(e) { console.error(e); }
    process.exit(0);
}
check();
