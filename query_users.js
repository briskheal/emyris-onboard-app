const { XlUser } = require('./db.js');
async function run() {
  const users = await XlUser.findAll();
  const res = users.filter(u => u.firstName.includes('Mohammad') || (u.lastName && u.lastName.includes('Kachhi')));
  console.log('Matches:', res.map(u => u.firstName + ' ' + u.lastName + ' | ' + u.email));
}
run();
