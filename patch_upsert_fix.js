const fs = require('fs');

let admin = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', 'utf8');

const replacementLogic = `// NEW LOGIC: Link Leave Approval to XlAttendance
        const { XlAttendance, Applicant, XlUser } = require('../db');
        const { v4: uuidv4 } = require('uuid');
        const generateId = () => Math.random().toString(36).substring(2, 15);
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

// Now patch xl.js
let xl = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');
const xlLogic = `// --- NEW LOGIC: INJECT INTO XlAttendance ---
                const { XlAttendance, XlUser } = require('../db');
                const generateId = () => Math.random().toString(36).substring(2, 15);
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
                }`;

const startMarker = `// --- NEW LOGIC: INJECT INTO XlAttendance ---`;
const endMarker = `// -------------------------------------------`;
const startIdx = xl.indexOf(startMarker);
const endIdx = xl.indexOf(endMarker) + endMarker.length;

if (startIdx !== -1 && endIdx !== -1) {
    xl = xl.substring(0, startIdx) + xlLogic + "\n                " + xl.substring(endIdx);
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', xl);
    console.log("Patched xl.js with findOne/create instead of upsert!");
} else {
    console.log("Could not find injection in xl.js");
}
