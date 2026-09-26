const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/patch_history_view.js';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(
    'if (!f.includes("Eye,")) {\\n    f = f.replace("import { Edit, ", "import { Edit, Eye, ");\\n}',
    'if (!f.includes("Eye")) {\\n    f = f.replace("Edit, FileText }", "Edit, Eye, FileText }");\\n}'
);

fs.writeFileSync(path, f);
console.log('Fixed patch');
