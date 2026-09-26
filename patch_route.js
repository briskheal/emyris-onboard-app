const fs = require('fs');

const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx';
let f = fs.readFileSync(filePath, 'utf8');

// Replace both occurrences of the bad route
f = f.replace(/\/extras\/secondary-sales\/edit\//g, '/extras/secondary/edit/');

fs.writeFileSync(filePath, f);
console.log('Fixed secondary sales edit route!');
