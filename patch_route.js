const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const route = `
router.get('/admin/trigger-date-migration', async (req, res) => {
    try {
        const { sequelize, Op } = require('../db');
        let totalUpdated = 0;
        const models = Object.values(sequelize.models);
        for (let model of models) {
            if (model.rawAttributes.date && model.rawAttributes.date.type.key === 'STRING') {
                const records = await model.findAll({
                    where: { date: { [Op.like]: '%-%-%', [Op.notLike]: '202%' } }
                });
                for (let record of records) {
                    const parts = record.date.split('-');
                    if (parts.length === 3) {
                        let [d, m, y] = parts;
                        d = d.padStart(2, '0'); m = m.padStart(2, '0');
                        if (y.length === 4) {
                            record.date = \`\${y}-\${m}-\${d}\`;
                            await record.save();
                            totalUpdated++;
                        }
                    }
                }
            }
        }
        res.json({ success: true, message: \`Migrated \${totalUpdated} records to YYYY-MM-DD\` });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
`;

if (!c.includes('/admin/trigger-date-migration')) {
    c = c.replace('module.exports = router;', route + 'module.exports = router;');
    fs.writeFileSync('routes/xl.js', c);
}
