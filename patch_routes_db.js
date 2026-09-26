const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/require\('\.\.\/models\/xlModels'\)/g, "require('../db')");
fs.writeFileSync(path, c);
console.log('routes/xl.js patched to require XlPrimarySalesItem from db');
