const fs = require('fs');
let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

// Patch DCR Monthly
const regexDcr = /const dcrs = await XlDCR\.findAll\(\{\s*where: \{\s*employeeId: email,\s*date: \{ \[Op\.startsWith\]: datePrefix \}\s*\}\s*\}\);/;

const replacementDcr = `
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } }) || await XlUser.findOne({ where: { uid: email } });
        let idArrayDcr = [email];
        if (user) {
            if (user.employeeId) idArrayDcr.push(user.employeeId);
            if (user.email) idArrayDcr.push(user.email);
            if (user.uid) idArrayDcr.push(user.uid);
        }
        const dcrs = await XlDCR.findAll({ 
            where: { 
                employeeId: { [Op.in]: idArrayDcr }, 
                date: { [Op.startsWith]: datePrefix } 
            } 
        });
`;

// Patch Attendance Monthly
const regexAtt = /const atts = await XlAttendance\.findAll\(\{\s*where: \{\s*employeeId: email,\s*date: \{ \[require\('sequelize'\)\.Op\.startsWith\]: datePrefix \}\s*\}\s*\}\);/;

const replacementAtt = `
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } }) || await XlUser.findOne({ where: { uid: email } });
        let idArrayAtt = [email];
        if (user) {
            if (user.employeeId) idArrayAtt.push(user.employeeId);
            if (user.email) idArrayAtt.push(user.email);
            if (user.uid) idArrayAtt.push(user.uid);
        }
        const atts = await XlAttendance.findAll({ 
            where: { 
                employeeId: { [require('sequelize').Op.in]: idArrayAtt }, 
                date: { [require('sequelize').Op.startsWith]: datePrefix } 
            } 
        });
`;

if (regexDcr.test(file)) {
    file = file.replace(regexDcr, replacementDcr);
    console.log("Patched DCR Monthly");
} else {
    console.log("Failed to match DCR Monthly");
}

if (regexAtt.test(file)) {
    file = file.replace(regexAtt, replacementAtt);
    console.log("Patched Attendance Monthly");
} else {
    console.log("Failed to match Attendance Monthly");
}

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', file);
