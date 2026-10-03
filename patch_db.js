const fs = require('fs');

const dbPath = 'db.js';
let content = fs.readFileSync(dbPath, 'utf8');

const patch = `        try { await sequelize.query('ALTER TABLE xl_doctors DROP COLUMN IF EXISTS "doctorCode";'); console.log('Dropped legacy doctorCode column.'); } catch(e) {}\n`;

if (!content.includes('DROP COLUMN IF EXISTS "doctorCode"')) {
    content = content.replace(/(await sequelize\.sync\(\);\s*)/, '$1' + patch);
    fs.writeFileSync(dbPath, content);
    console.log('Patch added to db.js');
} else {
    console.log('Patch already exists');
}
