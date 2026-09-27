const fs = require('fs');
let c = fs.readFileSync('models/xlModels.js', 'utf8');
c = c.replace(
    "status: { type: DataTypes.STRING, defaultValue: 'Active' },",
    "status: { type: DataTypes.STRING, defaultValue: 'Active' },\n        controls: { type: DataTypes.JSON, defaultValue: {} },"
);
fs.writeFileSync('models/xlModels.js', c);
console.log('Added controls to XlUser in xlModels.js');
