const fs = require('fs');
let c = fs.readFileSync('xl-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/<div className="text-sky-400 font-bold whitespace-nowrap mr-4 shrink-0 text-sm">ANNOUNCEMENT<\/div>/g, '');

fs.writeFileSync('xl-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed XL announcement prefix');
