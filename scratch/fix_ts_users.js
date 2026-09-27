const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  "const totalPages = Math.ceil(filteredProfiles.length / pageSize) || 1;",
  ""
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed totalPages TS error');
