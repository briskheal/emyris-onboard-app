const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/router\.get\('\/admin\/debug-data', async \(req, res\) => \{[\s\S]*?\}\);/,
`router.get('/admin/debug-data', async (req, res) => {
    try {
        const { XlDCR } = require('../db');
        const { Op } = require('sequelize');
        
        let doctorCalls = 0;
        let chemistCalls = 0;
        
        const datePrefix = '2026-09-';
        const whereUser = { employeeId: { [Op.in]: ['USR1', 'EMYFE118'] } };
        
        const dcrs = await XlDCR.findAll({ 
            where: { 
                date: { [Op.like]: \`\${datePrefix}%\` }, 
                ...whereUser 
            } 
        });
        
        dcrs.forEach(d => {
            if (d.entityType === 'Doctor') doctorCalls++;
            else if (d.entityType === 'Chemist') chemistCalls++;
        });

        res.json({ dcrsCount: dcrs.length, doctorCalls, chemistCalls });
    } catch(e) {
        res.json({ error: e.message });
    }
});`);

fs.writeFileSync('routes/xl.js', c);
console.log('Patched debug-data for DCR count check');
