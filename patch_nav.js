const fs = require('fs');

const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesHistory.tsx';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(/navigate\(\`\/creation\/primary-sales\?id=\\\${inv\._id}\`\)/g, "navigate(`/creation/primary-sales?id=${inv._id}`)");

fs.writeFileSync(path, f);
console.log('Fixed escape character in navigate call');
