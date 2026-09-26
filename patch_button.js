const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');
f = f.replace(/>Save Invoice</g, '>{editId ? "Update Invoice" : "Save Invoice"}<');
f = f.replace(/PRIMARY SALES ENTRY/g, '{editId ? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"}');
fs.writeFileSync(path, f);
