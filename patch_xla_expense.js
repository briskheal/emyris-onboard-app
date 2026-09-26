const fs = require('fs');
let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Expense.tsx', 'utf8');

const regex = /let workAreaType = 'Out-Station';\s*const tp = tpEntries\.find\(t => \{\s*try \{ return new Date\(t\.date\)\.toISOString\(\)\.split\('T'\)\[0\] === dateStr; \} catch\(x\)\{ return t\.date === dateStr; \}\s*\}\);\s*if \(tp\) \{\s*workArea = tp\.toMarket \|\| tp\.workingArea \|\| '';\s*workAreaType = tp\.type \|\| tp\.workAreaType \|\| 'Out-Station';\s*\}/;

const replacement = `
        const isSunday = dt.getDay() === 0;
        const holidayName = holidays[dateStr];
        let workAreaType = isSunday ? 'Sunday' : (holidayName ? 'Holiday' : 'Out-Station');
        
        const tp = tpEntries.find(t => {
           try { return new Date(t.date).toISOString().split('T')[0] === dateStr; } catch(x){ return t.date === dateStr; }
        });
        if (tp) {
           workArea = tp.toMarket || tp.workingArea || '';
           workAreaType = tp.type || tp.workAreaType || tp.activityType || workAreaType;
        }
`;

if (regex.test(file)) {
    file = file.replace(regex, replacement);
    console.log("Patched XLA Expense workAreaType logic");
} else {
    console.log("Failed to match XLA Expense workAreaType logic");
}

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Expense.tsx', file);
