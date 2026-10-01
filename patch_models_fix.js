const fs = require('fs');
let c = fs.readFileSync('models/xlModels.js', 'utf8');

// Remove from XlState
c = c.replace(/targetDoctorCalls: \{ type: DataTypes\.INTEGER, defaultValue: 0 \},\n\s*targetChemistCalls: \{ type: DataTypes\.INTEGER, defaultValue: 0 \},\n\s*targetStockistCalls: \{ type: DataTypes\.INTEGER, defaultValue: 0 \},/, '');

// Add to XlDesignation specifically
const targetStr = `const XlDesignation = sequelize.define('xl_designation', {`;
const replaceStr = `const XlDesignation = sequelize.define('xl_designation', {
        targetDoctorCalls: { type: DataTypes.INTEGER, defaultValue: 0 },
        targetChemistCalls: { type: DataTypes.INTEGER, defaultValue: 0 },
        targetStockistCalls: { type: DataTypes.INTEGER, defaultValue: 0 },`;

c = c.replace(targetStr, replaceStr);

fs.writeFileSync('models/xlModels.js', c);
console.log('Fixed model definition!');
