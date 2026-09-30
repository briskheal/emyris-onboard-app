const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const regex = /const shortMonth = month\.substring\(0, 3\);\s*const mStr = String\(monthNum\);\s*const monthVariants = \[month, shortMonth, monthNum, mStr\];/;

const replacement = `const allMonthsFull = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const allMonthsShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        
        let fullM = month;
        let shortM = month;
        let mm = 0;
        
        let sIdx = allMonthsShort.indexOf(month);
        if (sIdx !== -1) {
            fullM = allMonthsFull[sIdx];
            mm = sIdx + 1;
        } else {
            let fIdx = allMonthsFull.indexOf(month);
            if (fIdx !== -1) {
                shortM = allMonthsShort[fIdx];
                mm = fIdx + 1;
            }
        }
        
        let mmStr1 = String(mm).padStart(2, '0');
        let mmStr2 = String(mm);
        
        const monthVariants = [month, fullM, shortM, mmStr1, mmStr2];`;

c = c.replace(regex, replacement);

fs.writeFileSync('routes/xl.js', c);
console.log('Patched dashboard stats to handle month variants completely safely');
