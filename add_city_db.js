const fs = require('fs');
let c = fs.readFileSync('db.js', 'utf8');

const lines = c.split(/\r?\n/);
let chemistStart = lines.findIndex(l => l.includes("'ALTER TABLE xl_chemists ADD COLUMN lat1 DOUBLE;'") || l.includes("'ALTER TABLE xl_chemists ADD COLUMN IF NOT EXISTS \"lat1\" DOUBLE PRECISION;'"));

if (chemistStart !== -1) {
    lines.splice(chemistStart, 0, "            'ALTER TABLE xl_chemists ADD COLUMN IF NOT EXISTS \"city\" VARCHAR(255);',");
    fs.writeFileSync('db.js', lines.join('\n'));
    console.log("Successfully added city ALTER TABLE to db.js");
} else {
    // Find the sqlite version
    let sqliteStart = lines.findIndex(l => l.includes("'ALTER TABLE xl_chemists ADD COLUMN lat1 DOUBLE;'"));
    if(sqliteStart !== -1) {
         lines.splice(sqliteStart, 0, "            'ALTER TABLE xl_chemists ADD COLUMN city VARCHAR(255);',");
         fs.writeFileSync('db.js', lines.join('\n'));
         console.log("Successfully added city ALTER TABLE to db.js (sqlite)");
    } else {
         console.log("Could not find alter table location");
    }
}
