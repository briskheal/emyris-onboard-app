const fs = require('fs');
let src = fs.readFileSync('routes/admin.js', 'utf8');

src = src.replace(
    /if \(row\.division\) updates\.division = String\(row\.division\)\.trim\(\);/,
    "if (row.division) updates.division = String(row.division).trim();\n                    if (row.packaging) updates.packaging = String(row.packaging).trim();\n                    if (row.stock !== undefined && row.stock !== '') updates.stock = parseInt(row.stock) || 0;"
);

src = src.replace(
    /division: String\(row\.division \|\| ''\)\.trim\(\),/,
    "division: String(row.division || '').trim(),\n                        packaging: String(row.packaging || '').trim(),"
);

src = src.replace(
    /uid,\s*stock: 0/,
    "uid,\n                        stock: parseInt(row.stock) || 0"
);

fs.writeFileSync('routes/admin.js', src);
console.log('Backend patched for packaging and stock.');
