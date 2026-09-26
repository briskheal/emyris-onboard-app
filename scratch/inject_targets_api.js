const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

// The new targets API endpoints to add
const targetsApi = `
// ==========================================
// USER TARGETS API
// ==========================================

router.post('/targets', async (req, res) => {
    try {
        const { employeeId, userName, month, year, allocationType, lumpSumAmount, productTargets, totalProductAmount } = req.body;
        
        let target = await XlTarget.findOne({ where: { employeeId, month, year } });
        
        if (target) {
            target = await target.update({ userName, allocationType, lumpSumAmount, productTargets, totalProductAmount });
        } else {
            target = await XlTarget.create({
                employeeId,
                userName,
                targetPeriod: 'Monthly', // always monthly right now
                month,
                year,
                allocationType,
                lumpSumAmount,
                productTargets,
                totalProductAmount
            });
        }
        res.json({ success: true, target });
    } catch (e) {
        console.error('Target save error:', e);
        res.json({ success: false, message: e.message });
    }
});

router.get('/targets', async (req, res) => {
    try {
        const { month, year } = req.query;
        let where = {};
        if (month) where.month = month;
        if (year) where.year = year;
        
        const targets = await XlTarget.findAll({ where });
        res.json({ success: true, targets });
    } catch (e) {
        console.error('Target fetch error:', e);
        res.json({ success: false, message: e.message });
    }
});

router.get('/targets/rollup', async (req, res) => {
    try {
        const { month, year } = req.query;
        let where = {};
        if (month) where.month = month;
        if (year) where.year = year;

        // Fetch all targets for the period
        const allTargets = await XlTarget.findAll({ where });
        
        // Fetch all users to build hierarchy
        const allUsers = await XlUser.findAll({ attributes: ['_id', 'uid', 'firstName', 'lastName', 'reportingManager'] });
        const userMap = {};
        allUsers.forEach(u => userMap[u.uid] = { ...u.toJSON(), directTarget: 0, teamTarget: 0, children: [] });
        
        // Attach direct targets
        allTargets.forEach(t => {
            if (userMap[t.employeeId]) {
                const amount = t.allocationType === 'Lump-Sum' ? t.lumpSumAmount : t.totalProductAmount;
                userMap[t.employeeId].directTarget = amount;
                // Also store the raw target for easy display
                userMap[t.employeeId].rawTarget = t;
            }
        });
        
        // Build hierarchy
        allUsers.forEach(u => {
            if (u.reportingManager && userMap[u.reportingManager]) {
                userMap[u.reportingManager].children.push(u.uid);
            }
        });
        
        // Recursive rollup function
        function calculateTeamTarget(uid) {
            const user = userMap[uid];
            if (!user) return 0;
            let teamSum = 0;
            user.children.forEach(childUid => {
                const child = userMap[childUid];
                teamSum += child.directTarget + calculateTeamTarget(childUid);
            });
            user.teamTarget = teamSum;
            return teamSum;
        }
        
        // Calculate for all users
        Object.keys(userMap).forEach(uid => calculateTeamTarget(uid));
        
        // Format the final response
        const rollupData = Object.values(userMap).map(u => ({
            employeeId: u.uid,
            userName: \`\${u.firstName} \${u.lastName}\`,
            directTarget: u.directTarget,
            teamTarget: u.teamTarget,
            totalTarget: u.directTarget + u.teamTarget,
            rawTarget: u.rawTarget || null
        }));
        
        res.json({ success: true, targets: rollupData });
    } catch (e) {
        console.error('Target rollup error:', e);
        res.json({ success: false, message: e.message });
    }
});

router.delete('/targets/:id', async (req, res) => {
    try {
        const t = await XlTarget.findByPk(req.params.id);
        if (t) await t.destroy();
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

`;

c = c.replace('module.exports = router;', targetsApi + '\nmodule.exports = router;');

fs.writeFileSync('routes/admin.js', c);
console.log('Targets API endpoints injected into routes/admin.js');
