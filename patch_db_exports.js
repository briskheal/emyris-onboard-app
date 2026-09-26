const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/db.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/XlPrimarySales, XlSecondarySales/, "XlPrimarySales, XlPrimarySalesItem, XlSecondarySales");
c = c.replace(/module\.exports = \{([\s\S]*?)XlPrimarySales,([\s\S]*?)\};/, "module.exports = {$1XlPrimarySales, XlPrimarySalesItem,$2};");

fs.writeFileSync(path, c);
console.log('db.js patched to export XlPrimarySalesItem');
