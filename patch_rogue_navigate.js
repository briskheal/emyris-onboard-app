const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

f = f.replace("if (editId) { navigate(-1); return; }\n        setHeader({", "setHeader({");

fs.writeFileSync(path, f);
console.log('Removed rogue navigate(-1)');
