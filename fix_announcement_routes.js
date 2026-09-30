const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const regex = /router\.get\('\/admin\/announcement', async \(req, res\) => \{[\s\S]*?router\.post\('\/admin\/announcement', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, data: newAnnounce \}\);\n\s*\} catch\(e\) \{/m;

const replacement = `router.get('/admin/announcement', async (req, res) => {
    try {
        const { XlAnnouncement, Sequelize } = require('../db');
        const { Op } = Sequelize;
        const now = new Date();
        const announcement = await XlAnnouncement.findOne({ 
            where: { 
                active: true,
                [Op.or]: [
                    { validFrom: null },
                    { validFrom: { [Op.lte]: now } }
                ],
                [Op.and]: [
                    {
                        [Op.or]: [
                            { validUntil: null },
                            { validUntil: { [Op.gte]: now } }
                        ]
                    }
                ]
            }, 
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
        const { message, validFrom, validUntil } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Message required' });
        
        // Deactivate previous
        await XlAnnouncement.update({ active: false }, { where: { active: true } });
        
        // Create new
        const newAnnounce = await XlAnnouncement.create({ 
            message, 
            active: true,
            validFrom: validFrom ? new Date(validFrom) : null,
            validUntil: validUntil ? new Date(validUntil) : null
        });
        res.json({ success: true, data: newAnnounce });
    } catch(e) {`;

c = c.replace(regex, replacement);

fs.writeFileSync('routes/xl.js', c);
console.log('Fixed announcement routes');
