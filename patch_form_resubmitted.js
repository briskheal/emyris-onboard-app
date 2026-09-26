const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(
    "...(editId ? { status: \"Pending\" } : {})",
    "...(editId ? { status: \"Re-Submitted\" } : {})"
);

f = f.replace(
    "Primary Sales invoice saved as Pending successfully!",
    "Primary Sales invoice saved successfully!"
);

fs.writeFileSync(path, f);
console.log('Fixed PrimarySalesForm payload status');
