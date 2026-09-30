const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const regexPri = /if \(month\) whereClause\.month = month;/;
const replacementPri = `if (month) {
            const allMonthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const allMonthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            let fullM = month, shortM = month, mm = 1;
            let sIdx = allMonthsShort.indexOf(month);
            if (sIdx !== -1) { fullM = allMonthsFull[sIdx]; mm = sIdx + 1; }
            else { let fIdx = allMonthsFull.indexOf(month); if (fIdx !== -1) { shortM = allMonthsShort[fIdx]; mm = fIdx + 1; } }
            const monthVariants = [month, fullM, shortM, String(mm).padStart(2, '0'), String(mm)];
            whereClause.month = { [require('sequelize').Op.in]: monthVariants };
        }`;

c = c.replace(regexPri, replacementPri); // For primary-sales/all
c = c.replace(regexPri, replacementPri); // For secondary-sales/all (assuming it matches the next instance too)

fs.writeFileSync('routes/xl.js', c);
console.log('Patched primary and secondary sales endpoints to use monthVariants');
