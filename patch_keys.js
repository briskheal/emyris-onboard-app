const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', 'utf8');

f = f.replace(/key: 'stockistName'/g, "key: 'stockist'");
f = f.replace(/key: 'hq'/g, "key: 'headquarter'");
f = f.replace(/label: 'Sales Date'.*?key: 'salesDate'/g, "label: 'Sales Date', key: 'date'");

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', f);
console.log('Keys replaced successfully!');
