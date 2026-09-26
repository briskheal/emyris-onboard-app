const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

f = f.replace(
  "counts['Leave Request'] = await XlLeave.count({ where: condition });",
  "counts['Leave Request'] = await XlLeave.count({ where: condition });\n        counts['Primary Sales'] = await XlPrimarySales.count({ where: condition });\n        counts['Secondary Sales'] = await XlSecondarySales.count({ where: condition });"
);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', f);
console.log('patched routes/xl.js');
