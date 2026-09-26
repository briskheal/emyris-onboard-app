const fs = require('fs');
let content = fs.readFileSync('models/xlModels.js', 'utf8');

// Add approvedBy to XlLeave
content = content.replace(
  "adminRemarks: { type: DataTypes.TEXT },\n        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },",
  "adminRemarks: { type: DataTypes.TEXT },\n        approvedBy: { type: DataTypes.STRING },\n        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },"
);

content = content.replace(
  "adminRemarks: { type: DataTypes.TEXT },\r\n        // excelRowIndex",
  "adminRemarks: { type: DataTypes.TEXT },\r\n        approvedBy: { type: DataTypes.STRING },\r\n        // excelRowIndex"
D;

fs.writeFileSync('models/xlModels.js', content);
