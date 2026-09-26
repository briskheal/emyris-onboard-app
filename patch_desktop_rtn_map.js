const fs = require('fs');

const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx';
let f = fs.readFileSync(filePath, 'utf8');

f = f.replace(/selectedRtnPriceType: row\.priceType \? row\.priceType\.toUpperCase\(\) : 'PTS',/,
              "selectedRtnPriceType: row.rtnPriceType ? row.rtnPriceType.toUpperCase() : (row.priceType ? row.priceType.toUpperCase() : 'PTS'),");

fs.writeFileSync(filePath, f);
console.log('Desktop RtnPriceType mapped correctly!');
