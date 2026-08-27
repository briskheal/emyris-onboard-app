const fs = require('fs');
const file = 'xla-frontend/src/pages/ManageUsers.tsx';
let code = fs.readFileSync(file, 'utf8');
const search = 'if (editUser) {';
let idx = code.indexOf(search);
console.log(code.substring(idx + 4000, idx + 8000));
