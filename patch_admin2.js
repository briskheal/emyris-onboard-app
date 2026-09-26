const fs = require('fs');

let admin = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', 'utf8');

const replacementLogic = `// NEW LOGIC: Link Leave Approval to XlAttendance
        const { XlAttendance, Applicant, XlUser } = require('../db');
        const start = new Date(request.fromDate);
        const end = new Date(request.toDate);
        
        let correctEmployeeId = request.employeeEmail;
        try {
            // First check XlUser (Source of truth for XLA Attendance)
            const xlUser = await XlUser.findOne({ where: { email: request.employeeEmail } });
            if (xlUser && xlUser.employeeId) {
                correctEmployeeId = xlUser.employeeId;
            } else {
                // Fallback to Applicant
                const applicant = await Applicant.findOne({ email: request.employeeEmail }); // Mongoose query
                if (applicant && applicant.employeeId) {
                    correctEmployeeId = applicant.employeeId;
                }
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
        }`;

admin = admin.replace(/\/\/ NEW LOGIC: Link Leave Approval to XlAttendance[\s\S]*?(?=\s*\/\/\s*If newly approved)/, replacementLogic + "\n\n        ");

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', admin);
console.log("Patched admin.js again with XlUser lookup.");
