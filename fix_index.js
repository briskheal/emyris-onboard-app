const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('onclick="handlePhaseSubmission()"', '');
fs.writeFileSync('index.html', html);
console.log('Fixed index.html button onclick');
