const fs = require('fs');

const filesToPatchUsers = [
  'xla-frontend/src/pages/DoctorsListReport.tsx',
  'xla-frontend/src/pages/ChemistsListReport.tsx',
  'xla-frontend/src/pages/StockistsListReport.tsx',
  'xla-frontend/src/pages/LocationsListReport.tsx',
  'xla-frontend/src/pages/GeoFencingListReport.tsx',
  'xla-frontend/src/pages/GiftsListReport.tsx',
  'xla-frontend/src/pages/RoutesListReport.tsx'
];

for (const file of filesToPatchUsers) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("axios.get('/api/xl/admin/users')", "axios.get('/api/admin/users')");
  fs.writeFileSync(file, content);
}
console.log('Fixed users API URL');

const productsFile = 'xla-frontend/src/pages/ProductsListReport.tsx';
let productsContent = fs.readFileSync(productsFile, 'utf8');
productsContent = productsContent.replace(/p\.divisionName/g, 'p.division');
productsContent = productsContent.replace(/p\.supplierName/g, 'p.manufacturer');
fs.writeFileSync(productsFile, productsContent);
console.log('Fixed product fields');
