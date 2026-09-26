const fs = require('fs');
let c = fs.readFileSync('models/xlModels.js', 'utf8');
c = c.replace(/\\s*adminRemarks:\\s\ls type:\\s\lDataTypes.TEXT]s,/g, ' adminRemarks: { type: DataTypes.TEXT },\n        approvedBy: { type: DataTypes.STRING },');
fs.writeFileSync('models/xlModels.js', c);