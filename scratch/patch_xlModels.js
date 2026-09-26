const fs = require('fs');

let c = fs.readFileSync('models/xlModels.js', 'utf8');

c = c.replace(
  "status: { type: DataTypes.STRING, defaultValue: 'Active' },",
  "status: { type: DataTypes.STRING, defaultValue: 'Active' },\n        controls: { type: DataTypes.JSON, defaultValue: {} },"
);

c = c.replace(
  "name: { type: DataTypes.STRING, allowNull: false },",
  "name: { type: DataTypes.STRING, allowNull: false },\n        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },"
);

fs.writeFileSync('models/xlModels.js', c);
console.log('Updated models/xlModels.js');
