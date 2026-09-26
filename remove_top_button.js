const fs = require('fs');
const path = require('path');

const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/frontend/src/components/Admin/PayrunSystem.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /<button onClick=\{wipePayrun\} disabled=\{wiping \|\| finalizing\} className="btn btn-danger"[\s\S]*?<\/button>/;

if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Top button removed.");
} else {
    console.log("Could not find the top button.");
}
