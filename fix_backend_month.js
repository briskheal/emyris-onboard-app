const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/const targets = await XlTarget\.findAll\(\{ where: \{ month, year, \.\.\.whereUser \} \}\);/,
`const shortMonth = month.substring(0, 3);
        const mStr = String(monthNum);
        const monthVariants = [month, shortMonth, monthNum, mStr];
        const targets = await XlTarget.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });`);

c = c.replace(/const primary = await XlPrimarySales\.findAll\(\{ where: \{ month, year, \.\.\.whereUser \} \}\);/,
`const primary = await XlPrimarySales.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });`);

c = c.replace(/const secondary = await XlSecondarySales\.findAll\(\{ where: \{ month, year, \.\.\.whereUser \} \}\);/,
`const secondary = await XlSecondarySales.findAll({ where: { month: { [Op.in]: monthVariants }, year, ...whereUser } });`);

fs.writeFileSync('routes/xl.js', c);
console.log('Fixed backend month queries');
