const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/\{u\.name\}/g, "{u.name || u.firstName || u.businessName || 'Unnamed User'}");

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed u.name');
