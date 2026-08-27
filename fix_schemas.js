const fs = require('fs');
const path = require('path');
const file = path.join('models', 'xlModels.js');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/excelRowIndex: \{ type: DataTypes\.INTEGER, defaultValue: 999999 \},/g, '');
code = code.replace(/createdAt: \{ type: DataTypes\.DATE, defaultValue: DataTypes\.NOW \}/g, 'excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },\n        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }');

fs.writeFileSync(file, code);
console.log('Fixed schemas');
