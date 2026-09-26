const { XlUser } = require('./db.js');
async function run() {
  const users = await XlUser.findAll();
  console.log('Total users:', users.length);
  users.forEach(u => console.log(u.firstName + ' ' + u.lastName));
}
run();
