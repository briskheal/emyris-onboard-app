const fs = require('fs');
const path = require('path');
const file = path.join('models', 'xlModels.js');
let code = fs.readFileSync(file, 'utf8');

const targetModelCode = "\n" +
"    const XlTarget = sequelize.define('xl_target', {\n" +
"        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },\n" +
"        userEmail: { type: DataTypes.STRING, allowNull: false },\n" +
"        userName: { type: DataTypes.STRING },\n" +
"        targetPeriod: { type: DataTypes.STRING, allowNull: false },\n" +
"        month: { type: DataTypes.STRING },\n" +
"        year: { type: DataTypes.STRING, allowNull: false },\n" +
"        allocationType: { type: DataTypes.STRING, allowNull: false },\n" +
"        lumpSumAmount: { type: DataTypes.FLOAT, defaultValue: 0 },\n" +
"        productTargets: { type: DataTypes.JSON, defaultValue: [] },\n" +
"        totalProductAmount: { type: DataTypes.FLOAT, defaultValue: 0 },\n" +
"        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }\n" +
"    });\n";

if (!code.includes('XlTarget =')) {
    code = code.replace("const XlOutStationAllowance = sequelize.define('xl_out_station_allowance', {", targetModelCode + "\n    const XlOutStationAllowance = sequelize.define('xl_out_station_allowance', {");
    code = code.replace("XlOutStationAllowance\n    };", "XlOutStationAllowance,\n        XlTarget\n    };");
    fs.writeFileSync(file, code);
    console.log('XlTarget schema added!');
} else {
    console.log('XlTarget already exists.');
}
