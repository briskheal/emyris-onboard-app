const fs = require('fs');

let xl = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const injectionDeleteStr = `
            if (record) {
                record.used = Math.max(0, (record.used || 0) - days);
                await record.save();
            }
        }
        
        // --- NEW LOGIC: REMOVE FROM XlAttendance ---
        if (leave && leave.status === 'Approved') {
            const { XlAttendance, XlUser } = require('../db');
            const sd = new Date(leave.startDate);
            const ed = new Date(leave.endDate || leave.startDate);
            
            let correctEmployeeId = leave.employeeId;
            try {
                const xlUser = await XlUser.findOne({ where: { email: leave.employeeId } });
                if (xlUser && xlUser.employeeId) {
                    correctEmployeeId = xlUser.employeeId;
                }
            } catch (e) {}

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

xl = xl.replace(/if \(record\) \{\s*record\.used = Math\.max\(0, \(record\.used \|\| 0\) - days\);\s*await record\.save\(\);\s*\}\s*\}/, injectionDeleteStr);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', xl);
console.log("Patched DELETE /leave/:id inside xl.js");
