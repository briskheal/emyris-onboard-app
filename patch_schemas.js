const fs = require('fs');
const path = require('path');
const file = path.join('models', 'xlModels.js');
let code = fs.readFileSync(file, 'utf8');

const targets = [
  "status: { type: DataTypes.STRING, defaultValue: 'Pending' },\n          createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }",
  "status: { type: DataTypes.STRING, defaultValue: 'Pending' },\r\n          createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }"
];

let replaced = false;
for (const target of targets) {
  if (code.includes(target)) {
    const replacement = target.replace(
      "createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }", 
      "excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },\n          createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }"
    );
    code = code.split(target).join(replacement);
    replaced = true;
  }
}

if (replaced) {
  fs.writeFileSync(file, code);
  console.log('excelRowIndex added successfully!');
} else {
  console.log('Target string not found or already replaced.');
}
