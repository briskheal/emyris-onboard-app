const fs = require('fs');

let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const tpRegex = /const tp = await XlTourProgram\.findOne\(\{ where: \{ employeeId: email, month, year \} \}\);/;

const replacement = `
        const { Op } = require('sequelize');
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: email } }) || await XlUser.findOne({ where: { email } }) || await XlUser.findOne({ where: { uid: email } });
        let idArray = [email];
        if (user) {
            if (user.employeeId) idArray.push(user.employeeId);
            if (user.email) idArray.push(user.email);
            if (user.uid) idArray.push(user.uid);
        }
        const tp = await XlTourProgram.findOne({ where: { employeeId: { [Op.in]: idArray }, month, year } });
`;

if (tpRegex.test(file)) {
    file = file.replace(tpRegex, replacement);
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', file);
    console.log("Patched GET /tour-program/my in routes/xl.js");
} else {
    console.log("Could not find TP target string in routes/xl.js");
}
