const fs = require('fs');

let admin = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', 'utf8');

// We are going to replace the lookup logic with a bulletproof in-memory case-insensitive match
const oldLogicAdmin = `const xlUser = await XlUser.findOne({ where: { email: request.employeeEmail } });`;
const newLogicAdmin = `const users = await XlUser.findAll();
            const xlUser = users.find(u => u.email && u.email.toLowerCase() === request.employeeEmail.toLowerCase());`;

const oldLogicAdminApp = `const applicant = await Applicant.findOne({ email: request.employeeEmail }); // Mongoose query`;
const newLogicAdminApp = `const apps = await Applicant.find({});
                const applicant = apps.find(a => a.email && a.email.toLowerCase() === request.employeeEmail.toLowerCase());`;

admin = admin.replace(oldLogicAdmin, newLogicAdmin).replace(oldLogicAdminApp, newLogicAdminApp);
fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', admin);

let xl = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');
const oldLogicXl1 = `const xlUser = await XlUser.findOne({ where: { email: employeeId } });`;
const newLogicXl1 = `const users = await XlUser.findAll();
                  const xlUser = users.find(u => u.email && u.email.toLowerCase() === employeeId.toLowerCase());`;

const oldLogicXl2 = `const xlUser = await XlUser.findOne({ where: { email: record.employeeId } });`;
const newLogicXl2 = `const users = await XlUser.findAll();
                      const xlUser = users.find(u => u.email && u.email.toLowerCase() === record.employeeId.toLowerCase());`;

const oldLogicXl3 = `const xlUser = await XlUser.findOne({ where: { email: leave.employeeId } });`;
const newLogicXl3 = `const users = await XlUser.findAll();
                const xlUser = users.find(u => u.email && u.email.toLowerCase() === leave.employeeId.toLowerCase());`;

xl = xl.replace(oldLogicXl1, newLogicXl1).replace(oldLogicXl2, newLogicXl2).replace(oldLogicXl3, newLogicXl3);
fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', xl);

console.log("Patched all routes for case-insensitive lookup!");
