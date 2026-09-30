const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(/\s*const \{ Op \} = Sequelize;/g, '');

fs.writeFileSync('routes/xl.js', c);
console.log('Fixed duplicate Op declaration');
