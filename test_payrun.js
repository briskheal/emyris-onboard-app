require('dotenv').config();
const { Op } = require('sequelize');
const { Applicant } = require('./db');
const { XlUser, XlAttendance, XlDCR, XlHoliday, XlGlobalSettings } = require('./db');

async function testPayrunSync(month, year) {
    const payrunStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const payrunEnd = new Date(parseInt(year), parseInt(month), 0);
    const lastDay = payrunEnd.getDate();

    const datePrefix = `${year}-${String(month).padStart(2, '0')}`;
    const startDate = datePrefix + '-01';
    const endDate = datePrefix + '-' + String(lastDay).padStart(2, '0');

    // Fetch all applicants
    const allApplicants = await Applicant.find({}); console.log('Applicants:', allApplicants.length); // or find({}) if they patched it
    
    // Fetch all CRM users
    const allUsers = await XlUser.findAll({}); console.log('Users:', allUsers.length);
    
    // Fetch all attendances and DCRs
    const atts = await XlAttendance.findAll({ 
        where: { date: { [Op.between]: [startDate, endDate] } } 
    });
    const dcrs = await XlDCR.findAll({
        attributes: ['employeeId', 'date'],
        where: { date: { [Op.between]: [startDate, endDate] } }
    });

    // Merge DCRs into atts
    const attMap = new Set(atts.map(a => `${a.employeeId}_${a.date}`));
    const mergedData = [...atts.map(a => a.toJSON())];
    dcrs.forEach(d => {
        const key = `${d.employeeId}_${d.date}`;
        if (!attMap.has(key)) {
            mergedData.push({ employeeId: d.employeeId, date: d.date, punchInTime: 'DCR', punchOutTime: 'DCR' });
        }
    });

    const settings = await XlGlobalSettings.findOne();
    const workingDaysPref = settings && settings.workingDays ? settings.workingDays : {
        Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false
    };

    const holidays = await XlHoliday.findAll({
        where: { date: { [Op.between]: [startDate, endDate] } }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const applicant of allApplicants) {
        // Find matching CRM User
        const appEmpCode = (applicant.empCode || '').toString().toLowerCase().replace(/\s+/g, '');
        const appEmail = (applicant.email || '').toString().toLowerCase().trim();
        
        let crmUser = allUsers.find(u => {
            const uId = (u.employeeId || '').toString().toLowerCase().replace(/\s+/g, '');
            const uEmail = (u.email || '').toString().toLowerCase().trim();
            return (uId && appEmpCode && (uId === appEmpCode || uId.includes(appEmpCode) || appEmpCode.includes(uId))) ||
                   (uEmail && appEmail && uEmail === appEmail);
        });

        if (!crmUser) continue;

        let present = 0, holiday = 0, leave = 0, absent = 0, totalMonthDays = 0;
        
        const today = new Date();
        const todayYMD = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        for (let day = 1; day <= lastDay; day++) {
            totalMonthDays++;
            const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
            const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
                // Should check if it's leave? Wait, XLA attendance has leave?
                // Currently xla-frontend Attendance.tsx does:
                // if (s.toLowerCase().includes('leave')) status = 'L';
                // else if (s.toLowerCase().includes('absent')) status = 'A';
                // else status = 'P';
                const statusStr = (hasAtt.status || '').toLowerCase();
                if (statusStr.includes('leave')) leave++;
                else if (statusStr.includes('absent')) absent++;
                else present++;
            } else {
                if (isHoliday) holiday++;
                else if (isPast) absent++;
            }
        }
        
        console.log(`Applicant: ${applicant.fullName}, EmpCode: ${applicant.empCode}, P:${present} A:${absent} L:${leave} H:${holiday}`);
    }
}

testPayrunSync(9, 2026).catch(console.error);




