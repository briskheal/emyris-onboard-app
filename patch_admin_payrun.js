const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(rPath, 'utf8');

// The chunk to replace is quite large. Let's find exactly what to replace.
const startMarker = "const filePath = path.join(__dirname, '../Attendance/LATEST_ATTENDANCE.xlsx');";
const endMarker = "if (totalMonthDays === 0) totalMonthDays = 31;"; // We'll keep this line and everything after it.

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find markers");
    process.exit(1);
}

const replacement = `
        const { XlUser, XlAttendance, XlDCR, XlHoliday, XlGlobalSettings } = require('../db');
        const { Op } = require('sequelize');

        const allApplicants = await Applicant.find({});
        const allUsers = await XlUser.findAll({ raw: true });
        
        const monthNum = new Date(\`\${month} 1, \${year}\`).getMonth() + 1;
        const datePrefix = \`\${year}-\${String(monthNum).padStart(2, '0')}\`;
        
        const payrunStart = new Date(parseInt(year), monthNum - 1, 1);
        const payrunEnd = new Date(parseInt(year), monthNum, 0);
        const lastDay = payrunEnd.getDate();
        
        const startDate = datePrefix + '-01';
        const endDate = datePrefix + '-' + String(lastDay).padStart(2, '0');

        const atts = await XlAttendance.findAll({ 
            where: { date: { [Op.between]: [startDate, endDate] } }, raw: true 
        });
        const dcrs = await XlDCR.findAll({
            attributes: ['employeeId', 'date'],
            where: { date: { [Op.between]: [startDate, endDate] } }, raw: true
        });

        const attMap = new Set(atts.map(a => \`\${a.employeeId}_\${a.date}\`));
        const mergedData = [...atts];
        dcrs.forEach(d => {
            const key = \`\${d.employeeId}_\${d.date}\`;
            if (!attMap.has(key)) {
                mergedData.push({ employeeId: d.employeeId, date: d.date, punchInTime: 'DCR', punchOutTime: 'DCR' });
            }
        });

        const settings = await XlGlobalSettings.findOne({ raw: true });
        const workingDaysPref = settings && settings.workingDays ? settings.workingDays : {
            Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false
        };

        const holidays = await XlHoliday.findAll({
            where: { date: { [Op.between]: [startDate, endDate] } }, raw: true
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const previews = [];

        const parseDMY = (dateString) => {
            if (!dateString) return null;
            const parts = dateString.split(/[-/]/);
            if (parts.length !== 3) {
                const d = new Date(dateString);
                return isNaN(d.getTime()) ? null : d;
            }
            if (parts[0].length === 4) {
                const d = new Date(dateString);
                return isNaN(d.getTime()) ? null : d;
            }
            return new Date(\`\${parts[2]}-\${parts[1]}-\${parts[0]}\`);
        };
        
        for (const applicant of allApplicants) {
            let adoj = applicant.actualJoiningDate ? parseDMY(applicant.actualJoiningDate) : null;
            
            if (adoj && !isNaN(adoj.getTime()) && adoj > payrunEnd) {
                continue;
            }

            const sb = applicant.salaryBreakup || {};

            const appEmpCode = (applicant.empCode || '').toString().toLowerCase().replace(/\\s+/g, '');
            
            let crmUser = allUsers.find(u => {
                const uId = (u.employeeId || '').toString().toLowerCase().replace(/\\s+/g, '');
                return uId && appEmpCode && (uId === appEmpCode || uId.includes(appEmpCode) || appEmpCode.includes(uId));
            });
            
            if (crmUser) {
                let present = 0, holiday = 0, leave = 0, absent = 0, totalMonthDays = 0;
                
                const today = new Date();
                const todayYMD = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

                for (let day = 1; day <= lastDay; day++) {
                    totalMonthDays++;
                    const currentDate = new Date(parseInt(year), monthNum - 1, day);
                    const dStr = \`\${year}-\${String(monthNum).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
                    const dayStr = dayNames[currentDate.getDay()];
                    
                    const isWeeklyOff = !workingDaysPref[dayStr];
                    const isStateHoliday = holidays.some((h) => 
                        h.date === dStr && 
                        (!h.state || h.state === 'All' || h.state === 'N/A' || h.state === '' || h.state === crmUser.state)
                    );
                    const isHoliday = isWeeklyOff || isStateHoliday;
                    
                    const hasAtt = mergedData.find(a => (a.employeeId === crmUser.employeeId || a.employeeId === crmUser.email) && a.date === dStr);
                    const isPast = dStr < todayYMD;

                    if (hasAtt) {
                        const statusStr = (hasAtt.status || '').toLowerCase();
                        if (statusStr.includes('leave')) leave++;
                        else if (statusStr.includes('absent')) absent++;
                        else present++;
                    } else {
                        if (isHoliday) holiday++;
                        else if (isPast) absent++;
                    }
                }
                
                if (totalMonthDays === 0) totalMonthDays = 31;
`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex + endMarker.length);

fs.writeFileSync(rPath, newContent, 'utf8');
console.log("Successfully patched admin.js payrun preview logic!");

