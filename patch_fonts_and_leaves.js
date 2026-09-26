const fs = require('fs');
let c = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/frontend/src/components/Admin/PayrunSystem.tsx', 'utf8');

c = c.replace(/className="form-input-sm" style=\{\{ width: '70px', textAlign: 'center', padding: '4px' \}\}/g,
              `className="form-input-sm" style={{ width: '60px', textAlign: 'center', padding: '2px', fontSize: '0.85rem' }}`);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/frontend/src/components/Admin/PayrunSystem.tsx', c);

let admin = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', 'utf8');

// Inject leave approval syncing
const approvalLogic = `
        const isLWP = request.leaveTypeName.toLowerCase().includes('leave without pay') || request.leaveTypeName.toLowerCase().includes('lwp');

        // NEW LOGIC: Link Leave Approval to XlAttendance
        const { XlAttendance } = require('../db');
        const start = new Date(request.fromDate);
        const end = new Date(request.toDate);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const dateList = [];
            let curr = new Date(start);
            while (curr <= end) {
                const y = curr.getFullYear();
                const m = String(curr.getMonth() + 1).padStart(2, '0');
                const d = String(curr.getDate()).padStart(2, '0');
                dateList.push(\`\${y}-\${m}-\${d}\`);
                curr.setDate(curr.getDate() + 1);
            }

            if (status === 'Approved' && oldStatus !== 'Approved') {
                for (const dStr of dateList) {
                    await XlAttendance.upsert({
                        employeeId: request.employeeEmail,
                        date: dStr,
                        status: isLWP ? 'LWP' : 'Leave',
                        punchInTime: 'Leave',
                        punchOutTime: 'Leave',
                        dayRemarks: 'Auto-approved Leave',
                        daySubmitted: true
                    });
                }
            } else if ((status === 'Revoked' || status === 'Rejected') && oldStatus === 'Approved') {
                for (const dStr of dateList) {
                    await XlAttendance.destroy({
                        where: {
                            employeeId: request.employeeEmail,
                            date: dStr
                        }
                    });
                }
            }
        }`;

admin = admin.replace(/const isLWP = request\.leaveTypeName\.toLowerCase\(\)\.includes\('leave without pay'\) \|\| request\.leaveTypeName\.toLowerCase\(\)\.includes\('lwp'\);/, approvalLogic);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', admin);
console.log("Patched PayrunSystem frontend inputs AND admin.js leave logic.");
