const fs = require('fs');

let xl = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const injectionStr = `
                    if (assignment) {
                        assignment.used = (assignment.used || 0) + days;
                        await assignment.save();
                    }
                }
                
                // --- NEW LOGIC: INJECT INTO XlAttendance ---
                const { XlAttendance, XlUser } = require('../db');
                const sd = new Date(record.startDate);
                const ed = new Date(record.endDate || record.startDate);
                
                let correctEmployeeId = record.employeeId;
                try {
                    // Try to convert email to employee code if it is an email
                    const xlUser = await XlUser.findOne({ where: { email: record.employeeId } });
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
                    
                    const isLWP = record.leaveType === 'Leave Without Pay' || record.leaveType === 'LWP';

                    if (action === 'Approved') {
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
                    } else if (action === 'Revoked' || action === 'Rejected') {
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
                // -------------------------------------------
`;

// Replace the previous injection which just used `record.employeeId`
const startMarker = `// --- NEW LOGIC: INJECT INTO XlAttendance ---`;
const endMarker = `// -------------------------------------------`;
const startIdx = xl.indexOf(startMarker);
const endIdx = xl.indexOf(endMarker) + endMarker.length;

if (startIdx !== -1 && endIdx !== -1) {
    xl = xl.substring(0, startIdx) + injectionStr.substring(injectionStr.indexOf(startMarker)) + xl.substring(endIdx);
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', xl);
    console.log("Patched xl.js with correct employeeId resolution!");
} else {
    console.log("Could not find previous injection in xl.js");
}
