const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/alert\\\('Admin/g, "alert('Admin");
c = c.replace(/WIP\)\\\'}/g, "WIP)')}");

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed');
