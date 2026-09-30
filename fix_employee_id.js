const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/url \+= \`&employeeId=\$\{selectedDashboardUser\._id \|\| selectedDashboardUser\.employeeId \|\| selectedDashboardUser\.uid\}\`;/g, 
"url += `&employeeId=${selectedDashboardUser.uid || selectedDashboardUser.employeeId || selectedDashboardUser._id}`;");

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed employeeId extraction prioritizing uid');
