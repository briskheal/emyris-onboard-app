const fs = require('fs');
let p = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(p, 'utf8');

const oldLogic = `                const factor = payableDays / totalMonthDays;
                
                let ptDed = 0;
                let pfDed = 0;
                if (sb.applyPt !== false && sb.applyPt !== 'false' && sb.applyPt !== 0 && sb.applyPt !== '0') {
                    if (originalGross > 20000) ptDed = 200;
                    else if (originalGross > 15000) ptDed = 150;
                }
                if (sb.applyPf !== false && sb.applyPf !== 'false' && sb.applyPf !== 0 && sb.applyPf !== '0') {
                    if (originalGross >= 15000) pfDed = 1800;
                    else pfDed = 1200;
                }

                const calcBreakup = {
                    basic: Math.round(basic * factor),
                    hra: Math.round(hra * factor),
                    conveyance: Math.round(conv), 
                    medical: Math.round(med), 
                    lta: Math.round(lta * factor),
                    edu: Math.round(edu), 
                    special: Math.round(special * factor)
                };
                
                const baseNetSalary = Object.values(calcBreakup).reduce((a, b) => a + parseFloat(b), 0);`;

const newLogic = `                const factor = payableDays / totalMonthDays;
                
                const calcBreakup = {
                    basic: Math.round(basic * factor),
                    hra: Math.round(hra * factor),
                    conveyance: Math.round(conv * factor), 
                    medical: Math.round(med * factor), 
                    lta: Math.round(lta * factor),
                    edu: Math.round(edu * factor), 
                    special: Math.round(special * factor)
                };
                
                const baseNetSalary = Object.values(calcBreakup).reduce((a, b) => a + parseFloat(b), 0);
                const earnedGross = baseNetSalary;
                
                let ptDed = 0;
                let pfDed = 0;
                if (sb.applyPt !== false && sb.applyPt !== 'false' && sb.applyPt !== 0 && sb.applyPt !== '0') {
                    if (earnedGross > 20000) ptDed = 200;
                    else if (earnedGross >= 15000) ptDed = 150; // Typically 15000 is the lower bound inclusive/exclusive depending on state, keeping their existing threshold style
                    else ptDed = 0;
                }
                if (sb.applyPf !== false && sb.applyPf !== 'false' && sb.applyPf !== 0 && sb.applyPf !== '0') {
                    const earnedBasic = calcBreakup.basic;
                    const pfVal = Math.round(earnedBasic * 0.12);
                    pfDed = pfVal > 1800 ? 1800 : pfVal;
                }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(p, content, 'utf8');
console.log("Patched salary logic!");
