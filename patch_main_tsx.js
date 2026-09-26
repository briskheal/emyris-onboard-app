const fs = require('fs');
const file = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/main.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the badly escaped line
content = content.replace(/config\.headers\.Authorization.*/, 'config.headers.Authorization = `Bearer ${token}`;');
fs.writeFileSync(file, content);
console.log("Fixed main.tsx");
