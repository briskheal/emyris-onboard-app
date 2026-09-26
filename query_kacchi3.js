const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'D:/MY WORK FLOW/Emyris Onboard App/database.sqlite', logging: false });

const XlUser = sequelize.define('xl_users', {
    employeeId: { type: DataTypes.STRING },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING }
}, { timestamps: false });

const XlDCR = sequelize.define('xl_dcrs', {
    employeeId: { type: DataTypes.STRING },
    date: { type: DataTypes.STRING }
}, { timestamps: false });

async function run() {
    const kacchi = await XlUser.findOne({ where: { firstName: 'Mohammad' } });
    console.log('User:', kacchi.toJSON());

    const dcrs = await XlDCR.findAll({ where: { employeeId: kacchi.email }, limit: 2 });
    console.log('DCRs by email:', dcrs.map(d => d.toJSON()));

    const dcrsById = await XlDCR.findAll({ where: { employeeId: kacchi.employeeId }, limit: 2 });
    console.log('DCRs by employeeId:', dcrsById.map(d => d.toJSON()));
    
    const atts = await sequelize.query("SELECT * FROM xl_attendances WHERE employeeId = '" + kacchi.employeeId + "' OR employeeId = '" + kacchi.email + "'", { type: Sequelize.QueryTypes.SELECT });
    console.log('Atts:', atts.length);
}
run().catch(console.error);
