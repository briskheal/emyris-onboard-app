const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let c = fs.readFileSync(path, 'utf8');

// 1. Patch GET /primary-sales/all
// I will not map inside GET /all if possible, but actually we should map items back to productsData.
// Wait, GET /all doesn't use include currently, so it just returns the TEXT column productsData!
// If we drop productsData eventually, GET /all will need to include items.
const oldGetAll = /const sales = await XlPrimarySales\.findAll\(\{\s*where: whereClause,\s*order: \[\['createdAt', 'DESC'\]\]\s*\}\);/;
const newGetAll = `const { XlPrimarySalesItem } = require('../models/xlModels');
        const sales = await XlPrimarySales.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [{ model: XlPrimarySalesItem, as: 'items' }]
        });
        
        // Backwards compatibility mapper
        sales.forEach(sale => {
            if (sale.items && sale.items.length > 0) {
                sale.setDataValue('productsData', JSON.stringify(sale.items));
            }
        });`;
c = c.replace(oldGetAll, newGetAll);

// 2. Patch GET /primary-sales/:id
const oldGetOne = /const sale = await XlPrimarySales\.findByPk\(req\.params\.id\);/;
const newGetOne = `const { XlPrimarySalesItem } = require('../models/xlModels');
        let sale = await XlPrimarySales.findByPk(req.params.id, { include: [{ model: XlPrimarySalesItem, as: 'items' }] });
        if (sale && sale.items && sale.items.length > 0) {
            sale.setDataValue('productsData', JSON.stringify(sale.items));
        }`;
c = c.replace(oldGetOne, newGetOne);

// 3. Patch POST /primary-sales/save
const oldSave = /const newSale = await XlPrimarySales\.create\(\{([\s\S]*?)createdAt: new Date\(\)\s*\}\);/;
const newSave = `const newSale = await XlPrimarySales.create({$1createdAt: new Date()\n        });\n
        // Phase 2: Relational Inserts
        if (productsData && Array.isArray(productsData) && productsData.length > 0) {
            const { XlPrimarySalesItem } = require('../models/xlModels');
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
        }`;
c = c.replace(oldSave, newSave);

// 4. Patch PUT /primary-sales/update/:id
const oldUpdate = /await sale\.update\(\{([\s\S]*?)\}\);/g;
let updateCount = 0;
c = c.replace(oldUpdate, (match, p1) => {
    updateCount++;
    if (updateCount === 1) { // It's the first occurrence (update invoice)
        return `await sale.update({${p1}});\n
        // Phase 2: Relational Updates
        if (productsData && Array.isArray(productsData)) {
            const { XlPrimarySalesItem } = require('../models/xlModels');
            await XlPrimarySalesItem.destroy({ where: { saleId: sale._id } });
            
            if (productsData.length > 0) {
                const items = productsData.map(p => ({
                    saleId: sale._id,
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
        }`;
    }
    return match;
});

fs.writeFileSync(path, c);
console.log('Routes patched for Phase 2 database normalization.');
