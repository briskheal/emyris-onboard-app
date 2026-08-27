const fs = require('fs');
const path = require('path');
const file = path.join('xla-frontend', 'src', 'pages', 'ManageUsers.tsx');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    "{activeTab === 'set_target' && <PlaceholderTab title=\"Set User Target\" />}",
    "{activeTab === 'set_target' && <SetTargetTab />}"
);

const tsxCode = fs.readFileSync('C:/Users/J S DASH/.gemini/antigravity/brain/39381364-eb6d-4759-a060-3a45a24b699c/scratch/SetTargetTab.tsx', 'utf8');

if (!code.includes('function SetTargetTab(')) {
    code = code + '\n' + tsxCode;
    fs.writeFileSync(file, code);
    console.log('SetTargetTab component injected successfully!');
} else {
    console.log('SetTargetTab already exists!');
}
