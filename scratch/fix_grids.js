const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(/md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6/g, 'md:grid-cols-4 lg:grid-cols-5');

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed grids');
