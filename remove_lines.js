const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');
lines.splice(818, 15); // removes 819 to 833 (inclusive)
fs.writeFileSync('server.js', lines.join('\n'));
console.log('Removed legacy grade-exam endpoint');
