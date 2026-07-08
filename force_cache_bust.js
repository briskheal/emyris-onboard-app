const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/script\.js\?v=[^"]+/g, `script.js?v=${Date.now()}`);
fs.writeFileSync('index.html', indexHtml);
console.log('Cache busted index.html');
