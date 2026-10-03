const fs = require('fs');
let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "attributes: ['_id', 'uid', 'firstName', 'lastName']",
  "attributes: ['_id', 'uid', 'firstName', 'lastName', 'division', 'hq']"
);

c = c.replace(
  "userName: u.firstName + ' ' + (u.lastName || ''),\n                months:",
  "userName: u.firstName + ' ' + (u.lastName || ''),\n                division: u.division || '',\n                hq: u.hq || '',\n                months:"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Updated backend to return division and hq');
