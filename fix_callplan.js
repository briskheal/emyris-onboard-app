const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/CallPlan.tsx', 'utf8');

c = c.replace(/\{formatDDMMYYYY\(item\.date\)\}/g, '{item.date}');

fs.writeFileSync('xla-frontend/src/pages/CallPlan.tsx', c);
console.log('Fixed CallPlan');
