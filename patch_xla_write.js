const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx';
let c = fs.readFileSync(path, 'utf8');

const target = "productsData: validRows";

const replacement = `productsData: validRows.map((r: any) => ({
          id: r.id,
          product: r.productId,
          priceType: r.selectedPriceType || 'PTS',
          basePrice: r.customPrice || 0,
          qty: r.quantity || 0,
          free: r.freeStocks || 0,
          discount: r.discount || 0,
          exp: !!r.isExpiry,
          purcRtn: r.purcRtn || 0,
          rtnPriceType: r.selectedRtnPriceType || 'PTS',
          rtnPrice: r.customRtnPrice || 0
        }))`;

c = c.replace(target, replacement);

fs.writeFileSync(path, c);
console.log('XLA write adapter injected.');
