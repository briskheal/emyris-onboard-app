const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

const yearlyEndpoint = `
router.get('/targets/yearly', async (req, res) => {
    try {
        const { year } = req.query;
        let where = {};
        if (year) where.year = year;

        const allTargets = await XlTarget.findAll({ where });
        const allUsers = await XlUser.findAll({ attributes: ['_id', 'uid', 'firstName', 'lastName'] });
        
        const userMap = {};
        allUsers.forEach(u => {
            userMap[u.uid] = {
                uid: u.uid,
                userName: u.firstName + ' ' + (u.lastName || ''),
                months: {
                    April: 0, May: 0, June: 0, July: 0, August: 0, September: 0,
                    October: 0, November: 0, December: 0, January: 0, February: 0, March: 0
                },
                total: 0
            };
        });

        allTargets.forEach(t => {
            if (userMap[t.employeeId] && userMap[t.employeeId].months[t.month] !== undefined) {
                const amount = t.allocationType === 'Lump-Sum' ? (t.lumpSumAmount || 0) : (t.totalProductAmount || 0);
                userMap[t.employeeId].months[t.month] += amount;
                userMap[t.employeeId].total += amount;
            }
        });

        // Optional: filter out users with 0 total if you only want to show users with targets
        // const result = Object.values(userMap).filter(u => u.total > 0);
        const result = Object.values(userMap);
        
        res.json({ success: true, data: result });
    } catch (e) {
        console.error('Yearly target error:', e);
        res.json({ success: false, message: e.message });
    }
});
`;

// Insert it before the delete target endpoint
c = c.replace("router.delete('/targets/:id', async (req, res) => {", yearlyEndpoint + "\nrouter.delete('/targets/:id', async (req, res) => {");

fs.writeFileSync('routes/admin.js', c);
console.log('Yearly endpoint added!');
