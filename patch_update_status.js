const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(
    /amount: netInvValue,\s*month,\s*year,\s*productsData: JSON\.stringify\(productsData\)/g,
    "amount: netInvValue,\n            month,\n            year,\n            productsData: JSON.stringify(productsData),\n            ...(status ? { status } : {})"
);

fs.writeFileSync(path, f);
console.log('Fixed PUT endpoints in routes/xl.js to include status in the update block');
