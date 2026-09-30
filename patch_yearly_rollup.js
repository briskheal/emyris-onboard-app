const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(/userMap\[u\.uid\] \= \{[\s\S]*?uid\: u\.uid,/m, 
`userMap[u.employeeId] = {
                employeeId: u.employeeId,`);

c = c.replace(/function calculateTeamYearlyTarget\(uid\) \{/g, "function calculateTeamYearlyTarget(employeeId) {");
c = c.replace(/const childTeam = calculateTeamYearlyTarget\(childUid\);/g, "const childTeam = calculateTeamYearlyTarget(childId);");
c = c.replace(/Object\.keys\(userMap\)\.forEach\(uid => calculateTeamYearlyTarget\(uid\)\);/g, "Object.keys(userMap).forEach(k => calculateTeamYearlyTarget(k));");
c = c.replace(/Object\.keys\(userMap\)\.forEach\(uid => calculateTeamTarget\(uid\)\);/g, "Object.keys(userMap).forEach(k => calculateTeamTarget(k));");

fs.writeFileSync('routes/admin.js', c);
console.log('Fixed yearly target rollup keys');
