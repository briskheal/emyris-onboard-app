const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "row.proprietorName = d['Proprietor Name'] || d.proprietorName || '';",
  "row.proprietorName = d['Proprietor Name'] || d.proprietorName || d.Name || d.name || '';"
);

// We need to fix the businessName extraction so it doesn't wrongly consume d.Name if it's meant for proprietorName
c = c.replace(
  "row.businessName = d['Business Name'] || d.businessName || d.Name || d.name || '';",
  "row.businessName = d['Business Name'] || d.businessName || d['business name'] || '';"
);

c = c.replace(
  "row.mobile = String(d.Mobile || d.mobile || '');",
  "row.mobile = String(d.Mobile || d.mobile || d.Contact || d.contact || d['chemist contact'] || d['Chemist Contact'] || '');"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Fixed admin.js mappings');
