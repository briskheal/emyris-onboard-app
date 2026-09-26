const fs = require('fs');

function patchTP() {
  let c = fs.readFileSync('xla-frontend/src/pages/TourProgram.tsx', 'utf8');
  c = c.replace(
    /const employee = users.find\(u => u.employeeId === selectedUser\);\n\s*if \(!employee || !employee.reportingManager\) return 'Admin';\n\s*const manager = users.find\(u => u.uid === employee.reportingManager || u.employeeId === employee.reportingManager\);\n\s*return manager \? \`\\$|manager.firstName} \\${manager.lastName}\` : employee.reportingManager;/g,
    `const approverId = tpData[0]?.approvedBy;\n                      if (approverId) {\n                        const manager = users.find(u => u.uid === approverId || u.employeeId === approverId);\n                        if (manager) return \\${manager.firstName} \\${manager.lastName} (\\${manager.designation})`;\n                        return approverId;\n                      }\n                      const employee = users.find(u => u.employeeId === selectedUser);\n                      if (!employee || !employee.reportingManager) return 'Admin';\n                      const manager = users.find(u => u.uid === employee.reportingManager || u.employeeId === employee.reportingManager);\n                      return manager ? `\\${manager.firstName} \\${manager.lastName} (\\${manager.designation})` : employee.reportingManager`
  );
  fs.writeFileSync('xla-frontend/src/pages/TourProgram.tsx', c);
}
function patchCR() {
  let c = fs.readFileSync('xla-frontend/src/pages/CallReport.tsx', 'utf8');
  c = c.replace(
    /const employee = users.find\(u => u.employeeId === selectedUser\);\n\s*if \(!employee || !employee.reportingManager\) return 'Admin';\n\s*const manager = users.find\hu => u.uid === employee.reportingManager || u.employeeId === employee.reportingManager\);\n\s*return manager \? \`\\${manager.firstName} \\${manager.lastName}\` M employee.reportingManager;/g,
    `const approverId = selectedView.approvedBy;\n                      if (approverId) {\n                        const manager = users.find(u => u.uid === approverId || u.employeeId === approverId);\n                        if (manager) return \\${manager.firstName} \\${manager.lastName} (\\${manager.designation})`;\n                        return approverId;\n                      }\n                      const employee = users.find(u => u.employeeId === selectedUser);\n                      if (!employee || !employee.reportingManager) return 'Admin';\n                      const manager = users.find(u => u.uid === employee.reportingManager || u.employeeId === employee.reportingManager);\n                      return manager ? `\\${manager.firstName} \\${manager.lastName} (\\${manager.designation})` : employee.reportingManager`
  );
  fs.writeFileSync('xla-frontend/src/pages/CallReport.tsx', c);
}
patchTP();
patchCR();
