const fs = require('fs');
let code = fs.readFileSync('routes/xl.js', 'utf8');
code = code.replace(
  "XlHoliday, generateId } = require('../db');",
  "XlHoliday, XlProduct, generateId } = require('../db');"
);
fs.writeFileSync('routes/xl.js', code);
console.log('Fixed imports');
