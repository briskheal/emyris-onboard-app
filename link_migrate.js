const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

const regex = /app\.use\('\/api\/xl', xlRouter\);/;
const replacement = `const migrateRouter = require('./routes/migrate');
app.use('/api/xl', migrateRouter);
app.use('/api/xl', xlRouter);`;

c = c.replace(regex, replacement);

fs.writeFileSync('server.js', c);
console.log('Linked migrate router to server.js');
