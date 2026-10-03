const fs = require('fs');

const filesToPatch = [
  'xla-frontend/src/pages/DoctorsListReport.tsx',
  'xla-frontend/src/pages/ChemistsListReport.tsx',
  'xla-frontend/src/pages/StockistsListReport.tsx',
  'xla-frontend/src/pages/LocationsListReport.tsx',
  'xla-frontend/src/pages/GeoFencingListReport.tsx',
  'xla-frontend/src/pages/GiftsListReport.tsx',
  'xla-frontend/src/pages/RoutesListReport.tsx'
];

for (const file of filesToPatch) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('import CustomUserSelect')) {
    content = content.replace("import * as XLSX from 'xlsx';", "import * as XLSX from 'xlsx';\nimport CustomUserSelect from '../components/CustomUserSelect';");
  }

  // Replace native select logic
  const nativeSelectRegex = /<select[\s\S]*?<\/select>/;
  const customSelectCode = `<CustomUserSelect \n            users={users}\n            selectedUser={selectedUser}\n            onChange={(val) => {\n              setSelectedUser(val);\n              // Assuming fetchFunction is named dynamically, need to handle correctly.\n              // We'll replace it with string replace.\n            }}\n          />`;
  
  // Actually it's better to replace just the select HTML.
  // Wait, the handleUserChange function does both setSelectedUser and fetchDoctors.
  // I will just use onChange={handleUserChange} but handleUserChange expects an event right now.
  // Let's modify handleUserChange in each file to accept a string value.
  content = content.replace(/const handleUserChange = \(e: React\.ChangeEvent<HTMLSelectElement>\) => \{\n\s*const val = e\.target\.value;\n\s*setSelectedUser\(val\);\n\s*(fetch[A-Za-z]+)\(val\);\n\s*\};/, 
    "const handleUserChange = (val: string) => {\n    setSelectedUser(val);\n    $1(val);\n  };"
  );
  
  content = content.replace(/<select\s+value=\{selectedUser\}\s+onChange=\{handleUserChange\}[\s\S]*?<\/select>/, 
    "<CustomUserSelect users={users} selectedUser={selectedUser} onChange={handleUserChange} />"
  );

  fs.writeFileSync(file, content);
}
console.log('Replaced select dropdowns');
