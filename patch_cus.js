const fs = require('fs');
const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(filePath, 'utf8');

// Replace value="Cus" with value="CUS"
f = f.replace(/<option value="Cus">Cus<\/option>/g, '<option value="CUS">CUS</option>');

fs.writeFileSync(filePath, f);
console.log('Patched Cus to CUS in Mobile App');
