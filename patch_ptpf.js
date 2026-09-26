const fs = require('fs');
let p = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(p, 'utf8');

const oldPt = `if (sb.applyPt !== false) {`;
const newPt = `if (sb.applyPt !== false && sb.applyPt !== 'false' && sb.applyPt !== 0 && sb.applyPt !== '0') {`;

const oldPf = `if (sb.applyPf !== false) {`;
const newPf = `if (sb.applyPf !== false && sb.applyPf !== 'false' && sb.applyPf !== 0 && sb.applyPf !== '0') {`;

content = content.replace(oldPt, newPt);
content = content.replace(oldPf, newPf);

fs.writeFileSync(p, content, 'utf8');
console.log("Patched pt/pf logic");
