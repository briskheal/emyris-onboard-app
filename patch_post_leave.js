const fs = require('fs');

let xl = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const injectionStr = `
            if (record) {
                record.used = (record.used || 0) + days;
                await record.save();
            }
        }
        
        // --- NEW LOGIC: INJECT INTO XlAttendance ---
        if (finalStatus === 'Approved') {
            const { XlAttendance, XlUser } = require('../db');
            const generateId = () => Math.random().toString(36).substring(2, 15);
            const sd = new Date(startDate);
            const ed = new Date(endDate || startDate);
            
            let correctEmployeeId = employeeId;
            try {
                // Try to convert email to employee code if it is an email
                const xlUser = await XlUser.findOne({ where: { email: employeeId } });
                if (xlUser && xlUser.employeeId) {
                    correctEmployeeId = xlUser.employeeId;
                }
            } catch (e) {
                console.error("Failed to lookup employeeId", e);
            }

            if (!isNaN(sd.getTime()) && !isNaN(ed.getTime())) {
                const dateList = [];
                let curr = new Date(sd);
                while (curr <= ed) {
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, '0');
                    const d = String(curr.getDate()).padStart(2, '0');
                    dateList.push(\`\${y}-\${m}-\${d}\`);
                    curr.setDate(curr.getDate() + 1);
                }
                
                const isLWP = leaveType === 'Leave Without Pay' || leaveType === 'LWP';

                for (const dStr of dateList) {
                    const existing = await XlAttendance.findOne({ where: { employeeId: correctEmployeeId, date: dStr } });
                    if (existing) {
                        await existing.update({
                            status: isLWP ? 'LWP' : 'Leave',
                            punchInTime: 'Leave',
                            punchOutTime: 'Leave',
                            dayRemarks: 'Auto-approved Leave',
                            daySubmitted: true
                        });
                    } else {
                        await XlAttendance.create({
                            _id: generateId() + Date.now().toString(36),
                            employeeId: correctEmployeeId,
                            date: dStr,
                            status: isLWP ? 'LWP' : 'Leave',
                            punchInTime: 'Leave',
                            punchOutTime: 'Leave',
                            dayRemarks: 'Auto-approved Leave',
                            daySubmitted: true
                        });
                    }
                }
            }
        }
        // -------------------------------------------
`;

xl = xl.replace(/if \(record\) \{\s*record\.used = \(record\.used \|\| 0\) \+ days;\s*await record\.save\(\);\s*\}\s*\}/, injectionStr);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', xl);
console.log("Patched POST /leave inside xl.js");
