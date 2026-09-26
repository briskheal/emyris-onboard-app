const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx', 'utf8');

// Replace the mapping logic inside the useEffect
const oldMapping = `                   return {
                     id: row.id || Date.now() + i,
                     productId: prod ? (prod.uid || prod._id) : '',
                     selectedPriceType: row.priceType || 'PTS',
                     customPrice: row.basePrice || '',
                     quantity: row.qty || '',
                     freeStocks: row.free || '',
                     discount: row.discount || '',
                     isExpiry: !!row.exp,
                     purcRtn: row.purcRtn || '',
                     selectedRtnPriceType: row.priceType || 'PTS',
                     customRtnPrice: row.rtnPrice || ''
                   };`;

const newMapping = `                   return {
                     id: row.id || Date.now() + i,
                     productId: prod ? (prod.uid || prod._id) : '',
                     selectedPriceType: row.priceType ? row.priceType.toUpperCase() : 'PTS',
                     customPrice: row.basePrice || '',
                     quantity: row.qty || '',
                     freeStocks: row.free || '',
                     discount: row.discount || '',
                     isExpiry: !!row.exp,
                     purcRtn: row.purcRtn || '',
                     selectedRtnPriceType: row.priceType ? row.priceType.toUpperCase() : 'PTS',
                     customRtnPrice: row.rtnPrice || ''
                   };`;

f = f.replace(oldMapping, newMapping);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx', f);
console.log('Fixed Price Type Mapping');
