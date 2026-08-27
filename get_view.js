const fs = require('fs');
const file = 'xla-frontend/src/pages/ManageUsers.tsx';
let code = fs.readFileSync(file, 'utf8');
let idx = code.indexOf('function ViewUserOverlay');
console.log(code.substring(idx, idx + 4000));
