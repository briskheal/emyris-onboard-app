const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/const \[selectedMonth, setSelectedMonth\] = useState\('September'\);/g, '');
c = c.replace(/const \[selectedYear, setSelectedYear\] = useState\('2026'\);/g, '');

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed variables');
