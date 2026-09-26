const { XlAttendance, XlDCR, XlUser } = require('./db.js');
async function run() {
  const users = await XlUser.findAll();
  console.log('User names:', users.map(u => u.firstName + ' ' + u.lastName));
}
run();
