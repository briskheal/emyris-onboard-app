const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesHistory.tsx';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(
    "{(inv.status === 'Rejected' || inv.status === 'Pending') && (",
    "{(inv.status === 'Rejected' || inv.status === 'Pending' || inv.status === 'Re-Submitted') && ("
);

fs.writeFileSync(path, f);
console.log('Fixed History Edit button condition');
