const fs = require('fs');

let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const tpRegex2 = /const tp = await XlTourProgram\.findOne\(\{ where: \{ employeeId: user\.employeeId, month: monthStr, year \} \}\);/;

const replacement2 = `
        let idArray2 = [email];
        if (user) {
            if (user.employeeId) idArray2.push(user.employeeId);
            if (user.email) idArray2.push(user.email);
            if (user.uid) idArray2.push(user.uid);
        }
        const tp = await XlTourProgram.findOne({ where: { employeeId: { [Op.in]: idArray2 }, month: monthStr, year } });
`;

if (tpRegex2.test(file)) {
    file = file.replace(tpRegex2, replacement2);
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', file);
    console.log("Patched GET /expense/limits in routes/xl.js");
} else {
    console.log("Could not find Expense Limits TP target string in routes/xl.js");
}
