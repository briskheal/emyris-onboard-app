const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(/row\.mobile = String\(d\.Mobile \|\| d\.mobile \|\| ''\);/g, "row.mobile = String(d.Mobile || d.mobile || d.Contact || d.contact || d['chemist contact'] || d['Chemist Contact'] || '');");

c = c.replace(/row\.name = d\['Proprietor Name'\] \|\| d\.name \|\| '';/g, "row.name = d['Proprietor Name'] || d.name || d.Name || '';");

fs.writeFileSync('routes/admin.js', c);
console.log('Fixed ALL admin.js mappings');
