const fs = require('fs');

const files = [
  'xla-frontend/src/pages/DoctorsListReport.tsx',
  'xla-frontend/src/pages/ChemistsListReport.tsx',
  'xla-frontend/src/pages/StockistsListReport.tsx',
  'xla-frontend/src/pages/LocationsListReport.tsx',
  'xla-frontend/src/pages/GeoFencingListReport.tsx',
  'xla-frontend/src/pages/GiftsListReport.tsx',
  'xla-frontend/src/pages/RoutesListReport.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("if (res.data.success) setUsers(res.data.data);", "if (res.data.success) setUsers(res.data.users || res.data.data || []);");
  fs.writeFileSync(file, content);
}
console.log('Fixed setUsers in frontend files');
