const fs = require('fs');

let rPath = 'D:/MY WORK FLOW/Emyris Onboard App/frontend/src/pages/AdminPanel.tsx';
let content = fs.readFileSync(rPath, 'utf8');

const regex = /\/\* LEAVE MANAGEMENT ACCORDION \*\/[\s\S]*?(?=\/\* SUPPORT ACCORDION \*\/)/;

if (regex.test(content)) {
    content = content.replace(regex, "");
    fs.writeFileSync(rPath, content, 'utf8');
    console.log("Removed Leave Management menu.");
} else {
    console.log("Could not find the menu block.");
}
