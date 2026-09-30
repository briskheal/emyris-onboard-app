const fs = require('fs');
let src = fs.readFileSync('xla-frontend/src/pages/SecondarySales.tsx', 'utf8');
src = src.replace(/localStorage\.getItem\('user'\)/g, "localStorage.getItem('xla_user')");
fs.writeFileSync('xla-frontend/src/pages/SecondarySales.tsx', src);
