const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "const allUsers = await XlUser.findAll({ attributes: ['_id', 'uid', 'firstName', 'lastName'] });",
  "const allUsers = await XlUser.findAll({ attributes: ['_id', 'uid', 'firstName', 'lastName', 'hq', 'division', 'designation'] });"
);

c = c.replace(
  "userName: u.firstName + ' ' + (u.lastName || ''),",
  "userName: u.firstName + ' ' + (u.lastName || ''),\n                hq: u.hq,\n                division: u.division,\n                designation: u.designation,"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Fixed backend Yearly Targets attributes');
