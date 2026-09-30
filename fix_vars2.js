const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/const \[selectedMonth\] = useState\('Sep'\);/g, '');
c = c.replace(/const \[selectedYear\] = useState\('2026'\);/g, '');

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed variables');
