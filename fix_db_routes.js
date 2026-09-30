const fs = require('fs');

// 1. Export XlAnnouncement in db.js
let dbContent = fs.readFileSync('db.js', 'utf8');
if (!dbContent.includes('XlAnnouncement')) {
    dbContent = dbContent.replace(/XlTarget,\n\s*XlStockist,/g, 'XlTarget,\n    XlStockist,\n    XlAnnouncement,');
    
    // Also need to get it from initXlModels
    dbContent = dbContent.replace(/XlCallPlan\n} = initXlModels/g, 'XlCallPlan, XlAnnouncement\n} = initXlModels');
    
    fs.writeFileSync('db.js', dbContent);
    console.log('db.js updated');
}

// 2. Add Routes to routes/xl.js
let xlRoutesContent = fs.readFileSync('routes/xl.js', 'utf8');

// If we already appended the badly formatted string, let's remove it if it's there
// Since I couldn't inject it earlier, it might not be there at all.
const newRoutesStr = `
// --- ADMIN BROADCAST ANNOUNCEMENT ROUTES ---
router.get('/admin/announcement', async (req, res) => {
    try {
        const { XlAnnouncement } = require('../db');
        const announcement = await XlAnnouncement.findOne({ 
            where: { active: true }, 
            order: [['createdAt', 'DESC']] 
        });
        res.json({ success: true, data: announcement });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/admin/announcement', async (req, res) => {
    try {
        const { XlAnnouncement } = require('../db');
        const { message } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Message required' });
        
        // Deactivate previous
        await XlAnnouncement.update({ active: false }, { where: { active: true } });
        
        // Create new
        const newAnnounce = await XlAnnouncement.create({ message, active: true });
        res.json({ success: true, data: newAnnounce });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// --- ADMIN NOTIFICATIONS (RECENT ACTIVITY) ---
router.get('/admin/notifications', async (req, res) => {
    try {
        const { XlPrimarySales, XlSecondarySales, XlExpense } = require('../db');
        
        // Fetch 5 most recent from each
        const [primary, secondary, expenses] = await Promise.all([
            XlPrimarySales.findAll({ order: [['createdAt', 'DESC']], limit: 5 }),
            XlSecondarySales.findAll({ order: [['createdAt', 'DESC']], limit: 5 }),
            XlExpense.findAll({ order: [['createdAt', 'DESC']], limit: 5 })
        ]);
        
        let allActivity = [];
        primary.forEach(p => allActivity.push({ 
            id: p._id, type: 'Primary Sales', title: 'New Primary Sales', 
            message: \`Submitted for \${p.date || 'N/A'}\`, 
            date: p.createdAt 
        }));
        secondary.forEach(s => allActivity.push({ 
            id: s._id, type: 'Secondary Sales', title: 'New Secondary Sales', 
            message: \`Submitted for \${s.date || 'N/A'} by \${s.employeeId}\`, 
            date: s.createdAt 
        }));
        expenses.forEach(e => allActivity.push({ 
            id: e._id, type: 'Expense', title: 'New Expense Request', 
            message: \`\${e.type} - \${e.status}\`, 
            date: e.createdAt 
        }));
        
        allActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
        allActivity = allActivity.slice(0, 10);
        
        res.json({ success: true, data: allActivity });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
`;

if (!xlRoutesContent.includes('/admin/announcement')) {
    xlRoutesContent = xlRoutesContent.replace('module.exports = router;', newRoutesStr + '\nmodule.exports = router;');
    fs.writeFileSync('routes/xl.js', xlRoutesContent);
    console.log('routes/xl.js updated');
} else {
    console.log('routes already exist, replacing require models logic');
    // Fix existing routes if they are using the bad require pattern
    xlRoutesContent = xlRoutesContent.replace(/const \{ XlAnnouncement \} = require\('\.\.\/models\/xlModels'\)\(require\('\.\.\/db'\)\.sequelize\);/g, "const { XlAnnouncement } = require('../db');");
    xlRoutesContent = xlRoutesContent.replace(/const \{ XlPrimarySales, XlSecondarySales, XlExpense \} = require\('\.\.\/models\/xlModels'\)\(require\('\.\.\/db'\)\.sequelize\);/g, "const { XlPrimarySales, XlSecondarySales, XlExpense } = require('../db');");
    fs.writeFileSync('routes/xl.js', xlRoutesContent);
}
