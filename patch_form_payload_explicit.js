const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(
    "productsData: items",
    "productsData: items,\n        ...(editId ? { status: 'Re-Submitted' } : {})"
);

fs.writeFileSync(path, f);
console.log('Fixed PrimarySalesForm payload explicitly');
