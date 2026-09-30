const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/alert\('Error broadcasting message'\);/g, "alert('Error: ' + (e.response ? JSON.stringify(e.response.data) : e.message));");

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed');
