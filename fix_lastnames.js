const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

const regex1 = /\{u\.name \|\| u\.firstName \|\| u\.businessName \|\| 'Unnamed User'\}/g;
const replace1 = "{u.name || (u.firstName ? u.firstName + ' ' + (u.lastName || '') : '') || u.businessName || 'Unnamed User'}";

const regex2 = /\(selectedDashboardUser\.name \|\| selectedDashboardUser\.firstName \|\| selectedDashboardUser\.businessName \|\| ''\)/g;
const replace2 = "(selectedDashboardUser.name || (selectedDashboardUser.firstName ? selectedDashboardUser.firstName + ' ' + (selectedDashboardUser.lastName || '') : '') || selectedDashboardUser.businessName || '')";

const regex3 = /\(\(u\.name \|\| u\.firstName \|\| u\.businessName\) \|\| ''\)/g;
const replace3 = "((u.name || (u.firstName ? u.firstName + ' ' + (u.lastName || '') : '') || u.businessName) || '')";

c = c.replace(regex1, replace1);
c = c.replace(regex2, replace2);
c = c.replace(regex3, replace3);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed full names');
