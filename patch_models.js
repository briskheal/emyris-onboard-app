const fs = require('fs');
let c = fs.readFileSync('models/xlModels.js', 'utf8');

if (!c.includes('targetDoctorCalls: { type: DataTypes.INTEGER')) {
    c = c.replace(/status: \{ type: DataTypes\.STRING, defaultValue: 'Active' \},/,
    `status: { type: DataTypes.STRING, defaultValue: 'Active' },
        targetDoctorCalls: { type: DataTypes.INTEGER, defaultValue: 0 },
        targetChemistCalls: { type: DataTypes.INTEGER, defaultValue: 0 },
        targetStockistCalls: { type: DataTypes.INTEGER, defaultValue: 0 },`);
    fs.writeFileSync('models/xlModels.js', c);
    console.log('Added target call columns to XlDesignation');
} else {
    console.log('Columns already exist');
}
