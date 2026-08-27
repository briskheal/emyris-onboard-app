const fs = require('fs');
const files = [
  'xla-frontend/src/pages/ManageUsers.tsx',
  'xla-frontend/src/pages/ManageProducts.tsx',
  'xla-frontend/src/pages/ManageLocations.tsx',
  'xla-frontend/src/pages/ManageAllowances.tsx',
  'xla-frontend/src/pages/ManageDCS.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/className="min-h-screen/g, 'className="h-screen');
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Replaced min-h-screen with h-screen');
