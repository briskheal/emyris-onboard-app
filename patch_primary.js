const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx', 'utf8');

const targetUseEffect = `  useEffect(() => {
    if (id && products.length > 0 && stockists.length > 0) {
      axios.get(\`/api/xl/primary-sales/\${id}\`).then(res => {
        if (res.data.success) {
          const d = res.data.data;
          setFormData({
            date: d.date || '',
            invoiceDate: d.invoiceDate || '',
            invoiceNumber: d.invoiceNumber || '',
            division: d.division || '',
            headquarter: d.headquarter || '',
            stockist: d.stockist || ''
          });
          if (d.productsData) {
            try {
               const pData = JSON.parse(d.productsData);
               if (pData.length > 0) setRows(pData);
            } catch(e){}
          }
          
        }
      });
    }
  }, [id, products.length, stockists.length]);`;

const newUseEffect = `  useEffect(() => {
    if (id && products.length > 0 && stockists.length > 0) {
      axios.get(\`/api/xl/primary-sales/\${id}\`).then(res => {
        if (res.data.success) {
          const d = res.data.data;
          
          let st = d.stockist || '';
          const matchingStockist = stockists.find(s => s.businessName === st || s.name === st);
          if (matchingStockist) st = matchingStockist.uid || matchingStockist._id;
          
          let hq = d.headquarter || '';
          // Ensure exact string match for HQ if needed, though mobile usually passes uppercase.
          
          setFormData({
            date: d.date || '',
            invoiceDate: d.invoiceDate || '',
            invoiceNumber: d.invoiceNumber || '',
            division: d.division || '',
            headquarter: hq,
            stockist: st
          });
          
          if (d.productsData) {
            try {
               const pData = typeof d.productsData === 'string' ? JSON.parse(d.productsData) : d.productsData;
               if (Array.isArray(pData) && pData.length > 0) {
                 const adaptedRows = pData.map((row: any, i: number) => {
                   if (row.productId) return row; // Already desktop format
                   
                   const prod = products.find((p: any) => p.productName === row.product);
                   return {
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
                   };
                 });
                 setRows(adaptedRows);
               }
            } catch(e) { console.error('Error parsing products data:', e); }
          }
        }
      });
    }
  }, [id, products.length, stockists.length]);`;

if (f.includes(targetUseEffect)) {
  f = f.replace(targetUseEffect, newUseEffect);
  fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx', f);
  console.log('patched successfully');
} else {
  console.log('Target block not found, check the file for exact match');
}
