const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(/allUsers\.forEach\(u => userMap\[u\.uid\] = \{ \.\.\.u\.toJSON\(\), directTarget\: 0, teamTarget\: 0, children\: \[\] \}\);/g, 
"allUsers.forEach(u => userMap[u.employeeId] = { ...u.toJSON(), directTarget: 0, teamTarget: 0, children: [] });");

c = c.replace(/userMap\[u\.reportingManager\]\.children\.push\(u\.uid\);/g, 
"userMap[u.reportingManager].children.push(u.employeeId);");

c = c.replace(/function calculateTeamTarget\(uid\) \{/g, 
"function calculateTeamTarget(employeeId) {");

c = c.replace(/const user = userMap\[uid\];/g, 
"const user = userMap[employeeId];");

c = c.replace(/user\.children\.forEach\(childUid => \{/g, 
"user.children.forEach(childId => {");

c = c.replace(/const child = userMap\[childUid\];/g, 
"const child = userMap[childId];");

c = c.replace(/teamSum \+\= child\.directTarget \+ calculateTeamTarget\(childUid\);/g, 
"teamSum += child.directTarget + calculateTeamTarget(childId);");

c = c.replace(/calculateTeamTarget\(u\.uid\);/g, 
"calculateTeamTarget(u.employeeId);");

c = c.replace(/employeeId\: u\.uid,/g, 
"employeeId: u.employeeId,");

fs.writeFileSync('routes/admin.js', c);
console.log('Fixed target rollup to use employeeId instead of uid');
