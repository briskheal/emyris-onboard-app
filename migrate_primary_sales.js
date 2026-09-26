const { sequelize, XlPrimarySales, XlPrimarySalesItem } = require('./db');

async function migrate() {
    console.log('Starting Phase 2 Migration...');
    try {
        if (!XlPrimarySalesItem) {
            throw new Error('XlPrimarySalesItem is undefined! Did you export it from db.js?');
        }
        
        // Sync the new table
        await XlPrimarySalesItem.sync({ alter: true });
        console.log('XlPrimarySalesItem table created/synced.');
        
        // Fetch all existing sales
        const sales = await XlPrimarySales.findAll();
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
                        await XlPrimarySalesItem.destroy({ where: { saleId: sale._id } });
                        
                        const items = parsed.map(p => ({
                            saleId: sale._id,
                            product: p.product || p.productId || '',
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
                        totalItems += items.length;
                    }
                } catch (e) {
                    console.error('Failed to parse productsData for sale ID:', sale._id, e);
                }
            }
        }
        
        console.log('Migration completed successfully! Migrated ' + totalItems + ' product line items into relational table.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
