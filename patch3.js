const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(rPath, 'utf8');

// Replace the parsedSettings block
const oldLogic = `if (parsedSettings.set_working_days && parsedSettings.workingDays) {
                workingDaysPref = parsedSettings.workingDays;
            }`;

const newLogic = `if (parsedSettings.set_working_days) {
                workingDaysPref = parsedSettings.workingDays || { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true };
            }`;

content = content.replace(oldLogic, newLogic);

fs.writeFileSync(rPath, content, 'utf8');
console.log("Patched admin.js again for missing workingDays property!");
