const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/res\.json\(\{ dcrs \}\);/, 
`const {Op} = require('sequelize');
const stats = await XlDCR.findAll({ where: { date: { [Op.startsWith]: '2026-09-' } } });
const statsLike = await XlDCR.findAll({ where: { date: { [Op.like]: '2026-09-%' } } });
res.json({ dcrs: dcrs.slice(0,2), countStarts: stats.length, countLike: statsLike.length });`);

fs.writeFileSync('routes/xl.js', c);
