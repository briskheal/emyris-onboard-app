const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(/row\.mobile = String\(d\.Mobile \|\| d\.mobile \|\| d\.Contact \|\| d\.contact \|\| d\['chemist contact'\] \|\| d\['Chemist Contact'\] \|\| ''\);/g, "row.mobile = String(d.Mobile || d.mobile || d.Contact || d.contact || d['chemist contact'] || d['Chemist Contact'] || d['stockiest contact'] || d['Stockiest Contact'] || d['stockist contact'] || d['Stockist Contact'] || '');");

fs.writeFileSync('routes/admin.js', c);
console.log('Fixed ALL mobile mappings globally');
