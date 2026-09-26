const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/frontend/src/pages/AdminPanel.tsx';
let content = fs.readFileSync(rPath, 'utf8');

content = content.replace(/const \[leaveMenuExpanded, setLeaveMenuExpanded\] = useState\(false\);\n/g, "");
content = content.replace(/const \[leaveSubView, setLeaveSubView\] = useState\('create_type'\);\n/g, "");
content = content.replace(/Calendar, /g, "");

fs.writeFileSync(rPath, content, 'utf8');
console.log("Fixed unused variables");
