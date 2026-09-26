const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let c = fs.readFileSync(path, 'utf8');

// Patch GET /secondary-sales/all
// I need to add include: [{ model: XlSecondarySalesItem, as: 'items' }] and mapper
const oldGetAll = /const sales = await XlSecondarySales\.findAll\(\{\s*where: whereClause,\s*order: \[\['createdAt', 'DESC'\]\]\s*\}\);/;
const newGetAll = `const { XlSecondarySalesItem } = require('../db');
        const sales = await XlSecondarySales.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [{ model: XlSecondarySalesItem, as: 'items' }]
        });
        
        // Backwards compatibility mapper
        sales.forEach(sale => {
            if (sale.items && sale.items.length > 0) {
                sale.setDataValue('productsData', JSON.stringify(sale.items));
            }
        });`;
c = c.replace(oldGetAll, newGetAll);

// Patch GET /secondary-sales/:id
const oldGetOne = /const sale = await XlSecondarySales\.findByPk\(req\.params\.id\);/;
const newGetOne = `const { XlSecondarySalesItem } = require('../db');
        let sale = await XlSecondarySales.findByPk(req.params.id, { include: [{ model: XlSecondarySalesItem, as: 'items' }] });
        if (sale && sale.items && sale.items.length > 0) {
            sale.setDataValue('productsData', JSON.stringify(sale.items));
        }`;
c = c.replace(oldGetOne, newGetOne);

// Patch POST /secondary-sales/save
const oldSave = /const newSale = await XlSecondarySales\.create\(\{([\s\S]*?)createdAt: new Date\(\)\s*\}\);/;
const newSave = `const newSale = await XlSecondarySales.create({$1createdAt: new Date()\n        });\n
        // Phase 2: Relational Inserts
        if (productsData && Array.isArray(productsData) && productsData.length > 0) {
            const { XlSecondarySalesItem } = require('../db');
            const items = productsData.map(p => ({
                saleId: newSale._id,
                product: p.product || p.productId,
                qty: parseInt(p.qty || p.salesQty || 0),
                basePrice: parseFloat(p.basePrice || p.customPrice || p.price || 0),
                priceType: p.priceType || p.selectedPriceType || 'PTR',
                openingQty: parseInt(p.openingQty || 0),
                receivedQty: parseInt(p.receivedQty || 0),
                free: parseInt(p.free || p.freeStocks || 0),
                closingQty: parseInt(p.closingQty || 0)
            }));
            await XlSecondarySalesItem.bulkCreate(items);
        }`;
c = c.replace(oldSave, newSave);

// Patch PUT /secondary-sales/update/:id
const oldUpdate = /await sale\.update\(\{([\s\S]*?status,[\s\S]*?)\}\);/g;
let updateCount = 0;
c = c.replace(oldUpdate, (match, p1) => {
    // Only target the secondary-sales update, which has `amount` or `stockist`
    if (match.includes('amount') || match.includes('stockist')) {
        updateCount++;
        return `await sale.update({${p1}});\n
        // Phase 2: Relational Updates
        if (productsData && Array.isArray(productsData)) {
            const { XlSecondarySalesItem } = require('../db');
            await XlSecondarySalesItem.destroy({ where: { saleId: sale._id } });
            
            if (productsData.length > 0) {
                const items = productsData.map(p => ({
                    saleId: sale._id,
                    product: p.product || p.productId,
                    qty: parseInt(p.qty || p.salesQty || 0),
                    basePrice: parseFloat(p.basePrice || p.customPrice || p.price || 0),
                    priceType: p.priceType || p.selectedPriceType || 'PTR',
                    openingQty: parseInt(p.openingQty || 0),
                    receivedQty: parseInt(p.receivedQty || 0),
                    free: parseInt(p.free || p.freeStocks || 0),
                    closingQty: parseInt(p.closingQty || 0)
                }));
                await XlSecondarySalesItem.bulkCreate(items);
            }
        }`;
    }
    return match;
});

fs.writeFileSync(path, c);
console.log('routes/xl.js patched for Secondary Sales Phase 2');
