const { sequelize, XlSecondarySales, XlSecondarySalesItem } = require('./db');

async function migrate() {
    console.log('Starting Phase 2 Migration for Secondary Sales...');
    try {
        if (!XlSecondarySalesItem) {
            throw new Error('XlSecondarySalesItem is undefined! Did you export it from db.js?');
        }
        
        // Sync the new table
        await XlSecondarySalesItem.sync({ alter: true });
        console.log('XlSecondarySalesItem table created/synced.');
        
        // Fetch all existing sales
        const sales = await XlSecondarySales.findAll();
        let totalItems = 0;
        
        for (const sale of sales) {
            if (sale.productsData) {
                try {
                    let parsed = [];
                    if (typeof sale.productsData === 'string') {
                        parsed = JSON.parse(sale.productsData);
                    } else if (Array.isArray(sale.productsData)) {
                        parsed = sale.productsData;
                    }
                    
                    if (parsed.length > 0) {
                        // Clear existing items for safety (idempotent)
                        await XlSecondarySalesItem.destroy({ where: { saleId: sale._id } });
                        
                        const items = parsed.map(p => ({
                            saleId: sale._id,
                            product: p.product || p.productId || '',
                            qty: parseInt(p.qty || p.salesQty || 0),
                            basePrice: parseFloat(p.basePrice || p.customPrice || p.price || 0),
                            priceType: p.priceType || p.selectedPriceType || 'PTR',
                            openingQty: parseInt(p.openingQty || 0),
                            receivedQty: parseInt(p.receivedQty || 0),
                            free: parseInt(p.free || p.freeStocks || 0),
                            closingQty: parseInt(p.closingQty || 0)
                        }));
                        
                        await XlSecondarySalesItem.bulkCreate(items);
                        totalItems += items.length;
                    }
                } catch (e) {
                    console.error('Failed to parse productsData for sale ID:', sale._id, e);
                }
            }
        }
        
        console.log('Migration completed successfully! Migrated ' + totalItems + ' secondary product line items into relational table.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
