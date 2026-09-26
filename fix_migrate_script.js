const fs = require('fs');
let c = fs.readFileSync('migrate_primary_sales.js', 'utf8');
c = c.replace(/console\.log\(\\\`Migration.*?\\\`\);/g, "console.log('Migration completed successfully! Migrated ' + totalItems + ' product line items into relational table.');");
fs.writeFileSync('migrate_primary_sales.js', c);
