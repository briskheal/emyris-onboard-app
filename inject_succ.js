const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(
    'res.json({',
    'require("fs").writeFileSync("xla-frontend/dist/dash_success.txt", JSON.stringify({\n            success: true,\n            data: {\n                target: targetSum,\n                primary: primarySum,\n                secondary: secondarySum,\n                calls: {\n                    doctor: { actual: doctorCalls, target: targetDoctorCalls },\n                    chemist: { actual: chemistCalls, target: targetChemistCalls },\n                    stockist: { actual: stockistCalls, target: targetStockistCalls }\n                }\n            }\n        })); res.json({'
);
fs.writeFileSync('routes/xl.js', c);
