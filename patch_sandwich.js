const fs = require('fs');
let p = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(p, 'utf8');

const oldLogic = `                if (totalMonthDays === 0) totalMonthDays = 31;


                let payableDays = totalMonthDays - absent;`;

const newLogic = `                if (totalMonthDays === 0) totalMonthDays = 31;

                // SANDWICH EXCEPTION: If employee has 0 present and 0 approved leaves, holidays are treated as Loss of Pay (Absents)
                if (present === 0 && leave === 0 && absent > 0) {
                    absent += holiday;
                    holiday = 0;
                }

                let payableDays = totalMonthDays - absent;`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(p, content, 'utf8');
console.log("Patched sandwich rule!");
