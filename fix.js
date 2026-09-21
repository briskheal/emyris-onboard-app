const fs = require('fs');
let code = fs.readFileSync('routes/xl.js', 'utf8');

const regex = /const \{ XlGlobalSettings \} = require\('\.\.\/db'\);[\s\S]*?\/\/ Fallback to designation table if not on user[\s\S]*?if \(uOut === 0\) uOut = desRecord\.outStationAllowance \|\| 0;\n\s*\}\n\s*\}/;

const replacement = // Fallback to designation table if not on user
        if (uDaily === 0 || uEx === 0 || uOut === 0) {
            const desRecord = await XlDesignation.findOne({ where: { designationName: des } });
            if (desRecord) {
                if (uDaily === 0) uDaily = desRecord.dailyAllowance || 0;
                if (uEx === 0) uEx = desRecord.exStationAllowance || 0;
                if (uOut === 0) uOut = desRecord.outStationAllowance || 0;
            }
        }

        const { XlGlobalSettings } = require('../db');
        const settingsRecord = await XlGlobalSettings.findOne();
        if (settingsRecord && settingsRecord.settings && Array.isArray(settingsRecord.settings.daEligibleActivities)) {
            if (!settingsRecord.settings.daEligibleActivities.includes(activityType)) {
                uDaily = 0;
                uEx = 0;
                uOut = 0;
            }
        };

code = code.replace(regex, replacement);
fs.writeFileSync('routes/xl.js', code);

