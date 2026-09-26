const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let c = fs.readFileSync(path, 'utf8');

const oldBlock = `            try {
              const pData = typeof d.productsData === 'string' ? JSON.parse(d.productsData) : d.productsData;
              if (Array.isArray(pData) && pData.length > 0) {
                setItems(pData);
              }
            } catch(e) {}`;

const newBlock = `            try {
              const parsed = typeof d.productsData === 'string' ? JSON.parse(d.productsData) : d.productsData;
              if (Array.isArray(parsed) && parsed.length > 0) {
                const adapted = parsed.map((row: any, i: number) => {
                  if (row.product !== undefined) return row; // Already mobile format
                  return {
                    id: row.id || Date.now().toString() + i,
                    product: row.productId || '',
                    priceType: row.selectedPriceType || 'PTS',
                    basePrice: row.customPrice || 0,
                    qty: row.quantity || 0,
                    free: row.freeStocks || 0,
                    discount: row.discount || 0,
                    exp: row.isExpiry || false,
                    purcRtn: row.purcRtn || 0,
                    rtnPriceType: row.selectedRtnPriceType || 'PTS',
                    rtnPrice: row.customRtnPrice || 0
                  };
                });
                setItems(adapted);
              }
            } catch(e) {}`;

c = c.replace(oldBlock, newBlock);

fs.writeFileSync(path, c);
console.log('Adapter added');
