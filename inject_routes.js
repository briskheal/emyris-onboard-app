const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const newRoutes = `

// --- ADMIN BROADCAST ANNOUNCEMENT ROUTES ---
router.get('/admin/announcement', async (req, res) => {
    try {
        const { XlAnnouncement } = require('../models/xlModels')(require('../db').sequelize);
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
        const { XlAnnouncement } = require('../models/xlModels')(require('../db').sequelize);
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
        const { XlPrimarySales, XlSecondarySales, XlExpense } = require('../models/xlModels')(require('../db').sequelize);
        
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

// Find where to inject
if (!c.includes('/admin/announcement')) {
    c = c.replace(/router\.post\('\/notifications\/read', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true \}\);\s*\} catch\(e\) \{\s*res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}\s*\}\);/, 
      match => match + newRoutes
    );
    fs.writeFileSync('routes/xl.js', c);
    console.log('Routes added successfully.');
} else {
    console.log('Routes already exist.');
}
