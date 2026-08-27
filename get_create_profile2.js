const fs = require('fs');
const file = 'xla-frontend/src/pages/ManageUsers.tsx';
let code = fs.readFileSync(file, 'utf8');
let idx = code.indexOf('function CreateProfileTab');
console.log(code.substring(idx + 4000, idx + 8000));
