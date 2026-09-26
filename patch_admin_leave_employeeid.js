const fs = require('fs');

let admin = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', 'utf8');

const oldLogicStart = admin.indexOf('// NEW LOGIC: Link Leave Approval to XlAttendance');
const oldLogicEnd = admin.indexOf('const now = new Date();', oldLogicStart);

if (oldLogicStart !== -1 && oldLogicEnd !== -1) {
    const replacementLogic = `// NEW LOGIC: Link Leave Approval to XlAttendance
        const { XlAttendance, Applicant } = require('../db');
        const start = new Date(request.fromDate);
        const end = new Date(request.toDate);
        
        let correctEmployeeId = request.employeeEmail;
        try {
            // Find employee code from Applicant
            const applicant = await Applicant.findOne({ email: request.employeeEmail }); // Mongoose query
            if (applicant && applicant.employeeId) {
                correctEmployeeId = applicant.employeeId;
            }
        } catch (e) {
            console.error("Failed to lookup employeeId", e);
        }

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
                        employeeId: correctEmployeeId,
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
                            employeeId: correctEmployeeId,
                            date: dStr
                        }
                    });
                }
            }
        }

        `;
        
    admin = admin.substring(0, oldLogicStart) + replacementLogic + admin.substring(oldLogicEnd);
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', admin);
    console.log("Patched admin.js with correct logic!");
} else {
    console.log("Failed to find logic block");
}
