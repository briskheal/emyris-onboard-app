const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/SecondarySales.tsx', 'utf8');

// Fix the back button which was redirecting to login on new creation
content = content.replace("onClick={() => id ? navigate(-1) : navigate('/')}", "onClick={() => navigate(-1)}");

fs.writeFileSync('xla-frontend/src/pages/SecondarySales.tsx', content);
console.log('Fixed SecondarySales.tsx');
