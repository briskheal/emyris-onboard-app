const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

// The user asked to make the headers not so big, equal to other font sizes
content = content.replace(/text-2xl font-black/g, "text-lg font-bold");
content = content.replace(/text-xl font-black/g, "text-lg font-bold");

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', content, 'utf8');
console.log('Fixed ManageUsers font size');
