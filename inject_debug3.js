const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/res\.json\(\{ dcrs: dcrs\.slice\(0,2\).*\}\);/, 
`
        let whereUser = {}; // simulate no employeeId
        const targets = await XlTarget.findAll({ where: { month: { [Op.in]: ['Sep', 'September', '09', '9'] }, year: '2026', ...whereUser } });
        const dcrsSep = await XlDCR.findAll({ 
            where: { 
                date: { [Op.like]: '2026-09-%' }, 
                ...whereUser 
            } 
        });
        
        let targetSum = 0;
        targets.forEach(t => targetSum += (parseFloat(t.totalProductAmount) || 0) + (parseFloat(t.lumpSumAmount) || 0));
        
        let doctorCalls = 0;
        dcrsSep.forEach(d => {
            if (d.entityType === 'Doctor') doctorCalls++;
        });
        
        res.json({ 
            countStarts: stats.length, 
            dcrsSepCount: dcrsSep.length,
            doctorCalls,
            targetCount: targets.length,
            targetSum
        });
`);

fs.writeFileSync('routes/xl.js', c);
