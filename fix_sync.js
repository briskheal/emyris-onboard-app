const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');
content = content.replace('await sequelize.sync();', 'await sequelize.sync({ alter: true });');
fs.writeFileSync('server.js', content);
console.log('Fixed server.js sync parameter.');
