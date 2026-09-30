const fs = require('fs');
let src = fs.readFileSync('routes/xl.js', 'utf8');

// Fix 1: Month & Year payload extraction
src = src.replace(
  'const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, amount, productsData } = req.body;',
  'const { employeeId, date, month: reqMonth, year: reqYear, invoiceDate, invoiceNumber, division, headquarter, stockist, amount, productsData } = req.body;'
);

src = src.replace(
  "const month = date ? new Date(date).toLocaleString('en-US', { month: 'short' }) : new Date().toLocaleString('en-US', { month: 'short' });\n        const year = date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString();",
  "const month = reqMonth || (date ? new Date(date).toLocaleString('en-US', { month: 'short' }) : new Date().toLocaleString('en-US', { month: 'short' }));\n        const year = reqYear || (date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString());"
);

// Fix 2: Primary Sales missing items on save
const primarySavePatch = `
        const newSale = await XlPrimarySales.create({
            employeeId: employeeId || 'ADMIN',
            date,
            invoiceDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,
            grossInvValue,
            netInvValue,
            salableRtnValue,
            expiryRtnValue,
            amount: netInvValue, // Legacy fallback
            month,
            year,
            productsData: JSON.stringify(productsData),
            ...(status ? { status } : {}),
            status: 'Pending'
        });

        if (productsData && Array.isArray(productsData) && productsData.length > 0) {
            const { XlPrimarySalesItem } = require('../db');
            const items = productsData.map(p => ({
                saleId: newSale._id,
                product: p.product || p.productId,
                qty: parseInt(p.qty || p.quantity || 0),
                basePrice: parseFloat(p.basePrice || p.customPrice || 0),
                priceType: p.priceType || 'BASE PRICE',
                free: parseInt(p.free || 0),
                discount: parseFloat(p.discount || 0),
                exp: parseInt(p.exp || 0),
                purcRtn: parseInt(p.purcRtn || 0),
                rtnPriceType: p.rtnPriceType || 'BASE PRICE',
                rtnPrice: parseFloat(p.rtnPrice || 0)
            }));
            await XlPrimarySalesItem.bulkCreate(items);
        }
`;
src = src.replace(/const newSale = await XlPrimarySales\.create\(\{[\s\S]*?status: 'Pending'\n        \}\);/, primarySavePatch.trim());

// Fix 3: Secondary Sales missing items on save
const secondarySavePatch = `
        const products = typeof productsData === 'string' ? JSON.parse(productsData) : (productsData || []);
        
        const sale = await XlSecondarySales.create({
            employeeId,
            date,
            month,
            year,
            invoiceDate,
            invoiceNumber,
            division,
            headquarter,
            stockist,
            amount,
            productsData: JSON.stringify(products)
        });

        if (products.length > 0) {
            const { XlSecondarySalesItem } = require('../db');
            const itemRows = products.map(p => ({
                saleId: sale._id,
                productId: p.productId || p.product || '',
                product: p.product || p.productId || '',
                qty: p.salesQty || p.qty || 0,
                salesQty: p.salesQty || p.qty || 0,
                basePrice: p.basePrice || p.customPrice || 0,
                customPrice: p.basePrice || p.customPrice || 0,
                priceType: p.priceType || p.selectedPriceType || 'PTR',
                selectedPriceType: p.priceType || p.selectedPriceType || 'PTR',
                openingQty: p.openingQty || 0,
                receivedQty: p.receivedQty || 0,
                free: p.free || p.freeStocks || 0,
                freeStocks: p.free || p.freeStocks || 0,
                closingQty: p.closingQty || 0
            }));
            await XlSecondarySalesItem.bulkCreate(itemRows);
        }
`;
src = src.replace(/const sale = await XlSecondarySales\.create\(\{[\s\S]*?typeof productsData === 'string' \? productsData : JSON\.stringify\(productsData\)\n        \}\);/, secondarySavePatch.trim());

fs.writeFileSync('routes/xl.js', src);
console.log('Patched xl.js successfully');
