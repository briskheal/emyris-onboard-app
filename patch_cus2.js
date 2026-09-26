const fs = require('fs');
const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(filePath, 'utf8');

// Replace newType === 'Cus' with newType === 'CUS'
f = f.replace(/else if \(newType === 'Cus'\)/g, "else if (newType === 'CUS')");

fs.writeFileSync(filePath, f);
console.log('Patched Cus logic in auto-pricing');
