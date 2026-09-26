const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, regex, replacement) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content);
        console.log("Patched:", filePath);
    }
}

const dir = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages';
replaceInFile(path.join(dir, 'ManageAllowances.tsx'), /value: u\.uid \|\| u\.employeeId/g, 'value: u.employeeId || u.uid');
replaceInFile(path.join(dir, 'ManageLeave.tsx'), /value: u\.uid \|\| u\.employeeId/g, 'value: u.employeeId || u.uid');
