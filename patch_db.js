const fs = require('fs');
let c = fs.readFileSync('db.js', 'utf8');

if (!c.includes('ADD COLUMN targetDoctorCalls')) {
    c = c.replace(/await XlTarget\.sync\(\{ alter: true \}\);/, 
    `await XlTarget.sync({ alter: true });
        try { await sequelize.query("ALTER TABLE xl_designations ADD COLUMN \\"targetDoctorCalls\\" INTEGER DEFAULT 0;"); } catch(e) {}
        try { await sequelize.query("ALTER TABLE xl_designations ADD COLUMN \\"targetChemistCalls\\" INTEGER DEFAULT 0;"); } catch(e) {}
        try { await sequelize.query("ALTER TABLE xl_designations ADD COLUMN \\"targetStockistCalls\\" INTEGER DEFAULT 0;"); } catch(e) {}`);
    fs.writeFileSync('db.js', c);
    console.log('Added ALTER TABLE to db.js');
} else {
    console.log('ALTER TABLE already exists');
}
