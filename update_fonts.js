const fs = require('fs');
const files = [
  'xla-frontend/src/pages/ManageProducts.tsx',
  'xla-frontend/src/pages/ManageLocations.tsx',
  'xla-frontend/src/pages/ManageAllowances.tsx',
  'xla-frontend/src/pages/ManageDCS.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/text-2xl font-black/g, "text-lg font-bold");
    content = content.replace(/text-xl font-black/g, "text-lg font-bold");
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Modified font sizes in other pages');
