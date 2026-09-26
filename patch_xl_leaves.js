const fs = require('fs');

let xl = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const injectionStr = `
                    if (assignment) {
                        assignment.used = (assignment.used || 0) + days;
                        await assignment.save();
                    }
                }
                
                // --- NEW LOGIC: INJECT INTO XlAttendance ---
                const { XlAttendance } = require('../db');
                const sd = new Date(record.startDate);
                const ed = new Date(record.endDate || record.startDate);
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
                    
                    const isLWP = record.leaveType === 'Leave Without Pay' || record.leaveType === 'LWP';

                    if (action === 'Approved') {
                        for (const dStr of dateList) {
                            await XlAttendance.upsert({
                                employeeId: record.employeeId,
                                date: dStr,
                                status: isLWP ? 'LWP' : 'Leave',
                                punchInTime: 'Leave',
                                punchOutTime: 'Leave',
                                dayRemarks: 'Auto-approved Leave',
                                daySubmitted: true
                            });
                        }
                    } else if (action === 'Revoked' || action === 'Rejected') {
                        for (const dStr of dateList) {
                            await XlAttendance.destroy({
                                where: {
                                    employeeId: record.employeeId,
                                    date: dStr
                                }
                            });
                        }
                    }
                }
                // -------------------------------------------
`;

xl = xl.replace(/if \(assignment\) \{\s*assignment\.used = \(assignment\.used \|\| 0\) \+ days;\s*await assignment\.save\(\);\s*\}\s*\}/, injectionStr);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', xl);
console.log("Patched xl.js leave logic");
