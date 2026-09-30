const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(
  /const filteredUsers = users\.filter\(u => \(u\.name \|\| ''\)\.toLowerCase\(\)\.includes\(userSearchTerm\.toLowerCase\(\)\) \|\| \(u\.employeeId \|\| ''\)\.toLowerCase\(\)\.includes\(userSearchTerm\.toLowerCase\(\)\)\);/,
  "const filteredUsers = users.filter(u => ((u.name || u.firstName || u.businessName) || '').toLowerCase().includes(userSearchTerm.toLowerCase()) || (u.employeeId || '').toLowerCase().includes(userSearchTerm.toLowerCase()));"
);

c = c.replace(/selectedDashboardUser\.name/g, "(selectedDashboardUser.name || selectedDashboardUser.firstName || selectedDashboardUser.businessName || '')");

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed u.name in filter and selected');
