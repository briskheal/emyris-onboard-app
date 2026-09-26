const fs = require('fs');

let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx', 'utf8');

const regex = /let finalActivity = tp\.activityType \|\| tp\.activity;\s*if \(\!finalActivity\) \{\s*if \(holiday\) finalActivity = holiday\.title \|\| 'Holiday';\s*else if \(isSunday\) finalActivity = 'Weekly Off';\s*else finalActivity = 'Working';\s*\}/;

const replacement = `
            let finalActivity = tp.activityType || tp.activity;
            if (!finalActivity) {
                if (holiday) finalActivity = holiday.title || 'Holiday';
                else if (isSunday) finalActivity = 'Weekly Off';
                else finalActivity = 'Working';
            }
            // --- OVERRIDE WITH ACTUAL ATTENDANCE STATUS ---
            if (att && (att.status === 'Leave' || att.status === 'LWP')) {
                finalActivity = att.status;
            }
`;

if (regex.test(file)) {
    file = file.replace(regex, replacement);
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx', file);
    console.log("Patched XLA CallReport.tsx");
} else {
    console.log("Failed to match XLA CallReport.tsx");
}
