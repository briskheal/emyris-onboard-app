const fs = require('fs');
let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const replacements = [
    {
        regex: /const leaves = await XlLeave\.findAll\(\{ where: \{ employeeId: req\.query\.email \}, order: \[\['createdAt', 'DESC'\]\] \}\);/,
        replacement: `
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: req.query.email } }) || await XlUser.findOne({ where: { email: req.query.email } }) || await XlUser.findOne({ where: { uid: req.query.email } });
        let idArrayLeaves = [req.query.email];
        if (user) {
            if (user.employeeId) idArrayLeaves.push(user.employeeId);
            if (user.email) idArrayLeaves.push(user.email);
            if (user.uid) idArrayLeaves.push(user.uid);
        }
        const leaves = await XlLeave.findAll({ where: { employeeId: { [require('sequelize').Op.in]: idArrayLeaves } }, order: [['createdAt', 'DESC']] });
        `
    },
    {
        regex: /const exps = await XlExpense\.findAll\(\{ where: \{ employeeId: req\.query\.email \}, order: \[\['date', 'DESC'\]\] \}\);/,
        replacement: `
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: req.query.email } }) || await XlUser.findOne({ where: { email: req.query.email } }) || await XlUser.findOne({ where: { uid: req.query.email } });
        let idArrayExps = [req.query.email];
        if (user) {
            if (user.employeeId) idArrayExps.push(user.employeeId);
            if (user.email) idArrayExps.push(user.email);
            if (user.uid) idArrayExps.push(user.uid);
        }
        const exps = await XlExpense.findAll({ where: { employeeId: { [require('sequelize').Op.in]: idArrayExps } }, order: [['date', 'DESC']] });
        `
    },
    {
        regex: /const reqs = await XlBacklogRequest\.findAll\(\{ where: \{ employeeId: req\.query\.email \}, order: \[\['date', 'DESC'\]\] \}\);/,
        replacement: `
        const { XlUser } = require('../db');
        const user = await XlUser.findOne({ where: { employeeId: req.query.email } }) || await XlUser.findOne({ where: { email: req.query.email } }) || await XlUser.findOne({ where: { uid: req.query.email } });
        let idArrayReqs = [req.query.email];
        if (user) {
            if (user.employeeId) idArrayReqs.push(user.employeeId);
            if (user.email) idArrayReqs.push(user.email);
            if (user.uid) idArrayReqs.push(user.uid);
        }
        const reqs = await XlBacklogRequest.findAll({ where: { employeeId: { [require('sequelize').Op.in]: idArrayReqs } }, order: [['date', 'DESC']] });
        `
    }
];

let changed = false;
for (const r of replacements) {
    if (r.regex.test(file)) {
        file = file.replace(r.regex, r.replacement);
        changed = true;
    } else {
        console.log("Failed to match:", r.regex);
    }
}

if (changed) {
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', file);
    console.log("Patched additional legacy ID lookups in routes/xl.js");
}
