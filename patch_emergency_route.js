const fs = require('fs');

const file = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let content = fs.readFileSync(file, 'utf8');

const debugRoute = `
// ==========================================
// EMERGENCY DEBUG & FIX ROUTE
// ==========================================
router.get('/emergency-fix', async (req, res) => {
    try {
        const { sequelize } = require('../db');
        let logs = [];
        
        try {
            await sequelize.query("ALTER TABLE xl_stockists ADD COLUMN uid VARCHAR(255);");
            logs.push("Added uid to xl_stockists");
        } catch(e) { logs.push("xl_stockists error: " + e.message); }
        
        try {
            await sequelize.query("ALTER TABLE xl_products ADD COLUMN uid VARCHAR(255);");
            logs.push("Added uid to xl_products");
        } catch(e) { logs.push("xl_products error: " + e.message); }
        
        // Also check if any stockists exist
        try {
            const { XlStockist, XlProduct } = require('../db');
            const scount = await XlStockist.count();
            const pcount = await XlProduct.count();
            logs.push(\`Total Stockists in DB: \${scount}\`);
            logs.push(\`Total Products in DB: \${pcount}\`);
        } catch(e) { logs.push("Count error: " + e.message); }

        res.json({ success: true, logs });
    } catch(e) {
        res.json({ success: false, error: e.message });
    }
});
`;

if (!content.includes('/emergency-fix')) {
    content = content.replace("module.exports = router;", debugRoute + "\nmodule.exports = router;");
    fs.writeFileSync(file, content);
    console.log("Added /emergency-fix route!");
}
