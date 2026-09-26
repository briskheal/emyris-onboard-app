const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/db.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/XlSecondarySales,/g, "XlSecondarySales, XlSecondarySalesItem,");

fs.writeFileSync(path, c);
console.log('db.js patched to export XlSecondarySalesItem');
