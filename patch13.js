const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/TourProgram.tsx', 'utf8');

const newApprover = `
                    {(() => {
                      const employee = users.find(u => u.employeeId === selectedUser);
                      if (!employee || !employee.reportingManager) return 'Admin';
                      const manager = users.find(u => u.uid === employee.reportingManager || u.employeeId === employee.reportingManager);
                      return manager ? \${manager.firstName} \${manager.lastName}` : employee.reportingManager;
                    })()}
`;

content = content.replace(
  "<p className="text-xs font-medium text-slate-400\">{selectedUser || 'Admin'}</p>",
  "<p className="text-xs font-medium text-slate-400\">" + newApprover + "</p>"
);

fs.writeFileSync('xla-frontend/src/pages/TourProgram.tsx', content);