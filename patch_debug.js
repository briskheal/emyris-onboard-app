const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/const \{ XlTarget, XlPrimarySales, XlUser \} = require\('\.\.\/db'\);[\s\S]*?res\.json\(\{ targets, primary, users \}\);/,
`const { XlTarget, XlPrimarySales, XlUser, XlDCR } = require('../db');
        const dcrs = await XlDCR.findAll({ limit: 50, order: [['createdAt', 'DESC']] });
        res.json({ dcrs });`);

fs.writeFileSync('routes/xl.js', c);
console.log('Patched debug-data to dump DCRs');
