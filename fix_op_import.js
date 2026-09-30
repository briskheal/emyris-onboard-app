const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/const \{ XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlUser, XlCallPlan, Sequelize \} = require\('\.\.\/db'\);/,
`const { XlTarget, XlPrimarySales, XlSecondarySales, XlDCR, XlUser, XlCallPlan } = require('../db');
        const { Op } = require('sequelize');`);

c = c.replace(/const \{ Op \} = Sequelize;/, '');

fs.writeFileSync('routes/xl.js', c);
console.log('Fixed Sequelize Op import');
