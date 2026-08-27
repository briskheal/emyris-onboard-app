const fs = require('fs');
const file = 'xla-frontend/src/pages/ManageUsers.tsx';
let code = fs.readFileSync(file, 'utf8');
const search = 'function EditDeleteTab()';
let idx = code.indexOf(search);
console.log(code.substring(idx, idx + 2000));
