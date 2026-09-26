const fs = require('fs');
let code = fs.readFileSync('models/xlModels.js', 'utf8');

const regex = /headquarter: \{ type: DataTypes\.STRING \},/g;
const replacement = "headquarter: { type: DataTypes.STRING, set(val) { if(val) this.setDataValue('headquarter', val.toUpperCase().trim()); } },";

code = code.replace(regex, replacement);

fs.writeFileSync('models/xlModels.js', code);
console.log('Normalized headquarter field to uppercase for Doctor, Chemist, and Stockist.');
