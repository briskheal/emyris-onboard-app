const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(rPath, 'utf8');

// 1. Fix workingDaysPref
const oldSettingsLogic = `const settings = await XlGlobalSettings.findOne({ raw: true });
        const workingDaysPref = settings && settings.workingDays ? settings.workingDays : {
            Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false
        };`;

const newSettingsLogic = `const pref = await XlGlobalSettings.findOne();
        let workingDaysPref = { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false }; // Default fallback
        if (pref && pref.settings) {
            let parsedSettings = pref.settings;
            if (typeof parsedSettings === 'string') {
                try { parsedSettings = JSON.parse(parsedSettings); } catch(e) {}
            }
            if (parsedSettings.set_working_days && parsedSettings.workingDays) {
                workingDaysPref = parsedSettings.workingDays;
            }
        }`;

content = content.replace(oldSettingsLogic, newSettingsLogic);

// 2. Fix the absent logic (remove isPast)
const oldAbsentLogic = `const isPast = dStr < todayYMD;

                    if (hasAtt) {
                        const statusStr = (hasAtt.status || '').toLowerCase();
                        if (statusStr.includes('leave')) leave++;
                        else if (statusStr.includes('absent')) absent++;
                        else present++;
                    } else {
                        if (isHoliday) holiday++;
                        else if (isPast) absent++;
                    }`;

const newAbsentLogic = `const isPast = dStr < todayYMD;

                    if (hasAtt) {
                        const statusStr = (hasAtt.status || '').toLowerCase();
                        if (statusStr.includes('leave')) leave++;
                        else if (statusStr.includes('absent')) absent++;
                        else present++;
                    } else {
                        if (isHoliday) holiday++;
                        else absent++; // Count ANY unreported non-holiday day as absent, even if it hasn't happened yet (for payroll projection)
                    }`;

content = content.replace(oldAbsentLogic, newAbsentLogic);

fs.writeFileSync(rPath, content, 'utf8');
console.log("Patched admin.js successfully");
