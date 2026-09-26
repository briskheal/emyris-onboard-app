const fs = require('fs');

const file = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/Layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = "title={isSidebarCollapsed ? 'Log Out' : undefined}";
const replacement = "title={isSidebarCollapsed ? 'Log Out' : undefined} onClick={() => { localStorage.removeItem('xla_token'); navigate('/login'); }}";

if (content.includes(target) && !content.includes("onClick={() => { localStorage.removeItem('xla_token')")) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log("Logout button fixed.");
} else {
    console.log("Could not find target or already patched.");
}
