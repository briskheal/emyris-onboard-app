const db = require('./db.js');
async function run() {
  const dcrs = await db.XlDCR.findAll({ order: [['createdAt', 'DESC']], limit: 10 });
  console.log('Recent DCRs:', dcrs.map(d => d.employeeId + ' | ' + d.employeeName + ' | ' + d.date));
}
run();
