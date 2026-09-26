const fs = require('fs');
let p = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(p, 'utf8');

// Replace the calcBreakup to pro-rate all
content = content.replace(
    /conveyance:\s*Math\.round\(conv\),/,
    'conveyance: Math.round(conv * factor),'
);
content = content.replace(
    /medical:\s*Math\.round\(med\),/,
    'medical: Math.round(med * factor),'
);
content = content.replace(
    /edu:\s*Math\.round\(edu\),/,
    'edu: Math.round(edu * factor),'
);

// Move PT and PF calculations below baseNetSalary and use Earned variants
const oldPtPf = `                let ptDed = 0;
                let pfDed = 0;
                if (sb.applyPt !== false && sb.applyPt !== 'false' && sb.applyPt !== 0 && sb.applyPt !== '0') {
                    if (originalGross > 20000) ptDed = 200;
                    else if (originalGross > 15000) ptDed = 150;
                }
                if (sb.applyPf !== false && sb.applyPf !== 'false' && sb.applyPf !== 0 && sb.applyPf !== '0') {
                    if (originalGross >= 15000) pfDed = 1800;
                    else pfDed = 1200;
                }`;

// Using Regex to reliably strip the old block regardless of CRLF
const ptPfRegex = /let ptDed = 0;[\s\S]*?else pfDed = 1200;\s*}/;
content = content.replace(ptPfRegex, '');

const insertAfter = `const baseNetSalary = Object.values(calcBreakup).reduce((a, b) => a + parseFloat(b), 0);`;
const newPtPf = `const baseNetSalary = Object.values(calcBreakup).reduce((a, b) => a + parseFloat(b), 0);
                const earnedGross = baseNetSalary;
                
                let ptDed = 0;
                let pfDed = 0;
                if (sb.applyPt !== false && sb.applyPt !== 'false' && sb.applyPt !== 0 && sb.applyPt !== '0') {
                    if (earnedGross > 20000) ptDed = 200;
                    else if (earnedGross > 15000) ptDed = 150;
                    else ptDed = 0;
                }
                if (sb.applyPf !== false && sb.applyPf !== 'false' && sb.applyPf !== 0 && sb.applyPf !== '0') {
                    const earnedBasic = calcBreakup.basic || 0;
                    const pfVal = Math.round(earnedBasic * 0.12);
                    pfDed = pfVal > 1800 ? 1800 : pfVal;
                }`;

content = content.replace(insertAfter, newPtPf);

fs.writeFileSync(p, content, 'utf8');
console.log("Patched successfully!");
