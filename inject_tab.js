const fs = require('fs');
const path = require('path');
const file = path.join('xla-frontend', 'src', 'pages', 'ManageUsers.tsx');
let code = fs.readFileSync(file, 'utf8');

// Ensure SetTargetTab is injected instead of PlaceholderTab
code = code.replace(
    "{activeTab === 'set_target' && <PlaceholderTab title=\"Set User Target\" />}",
    "{activeTab === 'set_target' && <SetTargetTab />}"
);

const setTargetTabCode = fs.readFileSync('setTargetTabCode.txt', 'utf8');

if (!code.includes('function SetTargetTab(')) {
    code = code + '\n' + setTargetTabCode;
    fs.writeFileSync(file, code);
    console.log('SetTargetTab component added!');
} else {
    console.log('SetTargetTab already exists!');
}
