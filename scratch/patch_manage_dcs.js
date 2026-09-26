const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

c = c.replace(
  "const getControls = (type: string) => controls.filter(c => c.type === type);",
  "const getControls = (type: string) => controls.filter(c => c.type === type && c.isActive !== false);"
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Updated getControls to filter inactive');
