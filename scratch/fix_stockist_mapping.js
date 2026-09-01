const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "row.mobile = String(d.Mobile || d.mobile || d.Contact || d.contact || d['chemist contact'] || d['Chemist Contact'] || '');",
  "row.mobile = String(d.Mobile || d.mobile || d.Contact || d.contact || d['chemist contact'] || d['Chemist Contact'] || d['stockiest contact'] || d['Stockiest Contact'] || d['stockist contact'] || d['Stockist Contact'] || '');"
);

c = c.replace(
  "row.businessName = d['Business Name'] || d.businessName || d.Name || d.name || '';",
  "row.businessName = d['Business Name'] || d.businessName || d['business name'] || d.Name || d.name || '';"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Fixed stockist mappings');
