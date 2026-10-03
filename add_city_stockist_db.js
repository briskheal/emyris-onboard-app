const fs = require('fs');
let c = fs.readFileSync('db.js', 'utf8');

const lines = c.split(/\r?\n/);
let pgStart = lines.findIndex(l => l.includes("'ALTER TABLE xl_stockists ADD COLUMN IF NOT EXISTS \"lat1\" DOUBLE PRECISION;'"));
let sqliteStart = lines.findIndex(l => l.includes("'ALTER TABLE xl_stockists ADD COLUMN lat1 DOUBLE;'"));

if (pgStart !== -1) {
    lines.splice(pgStart, 0, "            'ALTER TABLE xl_stockists ADD COLUMN IF NOT EXISTS \"city\" VARCHAR(255);',");
}
if (sqliteStart !== -1) {
    // Note: since we modified the array by 1 line previously, sqliteStart might have shifted. Re-evaluate.
    sqliteStart = lines.findIndex(l => l.includes("'ALTER TABLE xl_stockists ADD COLUMN lat1 DOUBLE;'"));
    lines.splice(sqliteStart, 0, "            'ALTER TABLE xl_stockists ADD COLUMN city VARCHAR(255);',");
}

fs.writeFileSync('db.js', lines.join('\n'));
console.log("Successfully added city ALTER TABLE to db.js for Stockists");
