const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');
f = f.replace(
    'productsData: validRows',
    'productsData: validRows,\n          ...(editId ? { status: "Pending" } : {})'
);
fs.writeFileSync(path, f);
