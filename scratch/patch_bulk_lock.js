const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

const bulkLockRoute = `
router.put('/users/bulk-lock', async (req, res) => {
    try {
        const { XlUser } = require('../db');
        const { hq, locked, lockedReason } = req.body;
        const users = await XlUser.findAll({ where: { hq } });
        for (const user of users) {
            let controls = user.controls;
            if (typeof controls === 'string') {
               try { controls = JSON.parse(controls); } catch(e) { controls = {}; }
            }
            if (!controls || typeof controls !== 'object') controls = {};
            
            controls.locked = locked;
            controls.lockedReason = lockedReason || '';
            await user.update({ controls });
        }
        res.json({ success: true, count: users.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
});
`;

c = c.replace("module.exports = router;", bulkLockRoute + "\nmodule.exports = router;");
fs.writeFileSync('routes/admin.js', c);
console.log('Added bulk-lock route to routes/admin.js');
