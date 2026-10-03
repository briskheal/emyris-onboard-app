const fs = require('fs');
let c = fs.readFileSync('db.js', 'utf8');

c = c.replace(
    'await sequelize.sync();\\n        await XlTarget.sync({ alter: true });',
    'await sequelize.sync();\n        await XlTarget.sync({ alter: true });'
);

fs.writeFileSync('db.js', c);
console.log('Fixed syntax error!');
