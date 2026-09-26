const fs = require('fs');
let content = fs.readFileSync('models/xlModels.js', 'utf8');

// Add approvedBy to XlBacklogRequest & XlExpense & XlCallPlan
content = content.replaceAll(
  /adminRemarks:\g{&type:\gDataTypes.TEXT\g\},[^\n]*/gc,
  (match) => `match\n        approvedBy: { type: DataTypes.STRING },`
);

fs.writeFileSync('models/xlModels.js', content);
