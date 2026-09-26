const fs = require('fs');

let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const regex = /let tp = await XlTourProgram\.findOne\(\{ where: \{ employeeId, month, year \} \}\);/;

const replacement = `
        const { Op } = require('sequelize');
        const { XlUser } = require('../db');
        const userForId = await XlUser.findOne({ where: { employeeId } }) || await XlUser.findOne({ where: { email: employeeId } }) || await XlUser.findOne({ where: { uid: employeeId } });
        let idArray3 = [employeeId];
        if (userForId) {
            if (userForId.employeeId) idArray3.push(userForId.employeeId);
            if (userForId.email) idArray3.push(userForId.email);
            if (userForId.uid) idArray3.push(userForId.uid);
        }
        let tp = await XlTourProgram.findOne({ where: { employeeId: { [Op.in]: idArray3 }, month, year } });
`;

if (regex.test(file)) {
    file = file.replace(regex, replacement);
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', file);
    console.log("Patched POST /tour-program");
} else {
    console.log("Failed to match POST /tour-program");
}
