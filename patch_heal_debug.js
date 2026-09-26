const fs = require('fs');
const file = 'D:/MY WORK FLOW/Emyris Onboard App/server.js';
let content = fs.readFileSync(file, 'utf8');

const debugRoute = `
app.get('/api/heal-db', async (req, res) => {
    try {
        const { sequelize, XlStockist, XlProduct, XlUser } = require('./db');
        let logs = [];
        
        try {
            await sequelize.query("ALTER TABLE xl_stockists ADD COLUMN uid VARCHAR(255);");
        } catch(e) {}
        try {
            await sequelize.query("ALTER TABLE xl_products ADD COLUMN uid VARCHAR(255);");
        } catch(e) {}
        
        const scount = await XlStockist.count();
        const pcount = await XlProduct.count();
        
        const products = await XlProduct.findAll({ limit: 5 });
        const stockists = await XlStockist.findAll({ limit: 5 });
        const user = await XlUser.findOne({ where: { email: 'hradmin@emyrishr.in' } });
        
        res.json({ 
            success: true, 
            counts: { stockists: scount, products: pcount },
            sampleProducts: products,
            sampleStockists: stockists,
            hradminUser: user
        });
    } catch(e) {
        res.json({ success: false, error: e.message });
    }
});
`;

// Replace the old block
content = content.replace(/app\.get\('\/api\/heal-db'[\s\S]*?\}\);/, debugRoute.trim());
fs.writeFileSync(file, content);
