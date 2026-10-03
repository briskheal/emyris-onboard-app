const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const anchor = 'targetStockistCalls = workingDays * sTargetPerDay;';
const payload = `require("fs").writeFileSync("xla-frontend/dist/dash_success.txt", JSON.stringify({
            success: true,
            reqQuery: req.query,
            datePrefix,
            workingDays,
            actualDocs: doctorCalls,
            targetDocs: targetDoctorCalls
        }));`;

c = c.replace(anchor, anchor + '\n' + payload);
fs.writeFileSync('routes/xl.js', c);
