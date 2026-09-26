const fs = require('fs');

const routeFile = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let content = fs.readFileSync(routeFile, 'utf8');

content = content.replace(
    `res.status(500).json({ error: 'Failed to fetch products for reports' });`,
    `res.status(500).json({ error: 'Failed to fetch products for reports', details: e.message });`
);

content = content.replace(
    `res.status(500).json({ error: 'Failed to fetch stockists' });`,
    `res.status(500).json({ error: 'Failed to fetch stockists', details: e.message });`
);

fs.writeFileSync(routeFile, content);
console.log("Added error details to /api/xl routes");
