const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const original = `        if (user.status === 'Deactivated') {
            return res.json({ success: false, message: 'Your account is deactivated. Contact admin.' });
        }`;

const replacement = `        if (user.status === 'Deactivated') {
            return res.json({ success: false, message: 'Your account is deactivated. Contact admin.' });
        }
        
        let controls = {};
        try {
            if (typeof user.controls === 'string') controls = JSON.parse(user.controls);
            else if (typeof user.controls === 'object' && user.controls !== null) controls = user.controls;
        } catch(e) {}
        
        if (controls.locked) {
            return res.json({ success: false, message: controls.lockedReason || 'Your account is locked by Admin.' });
        }`;

c = c.replace(original, replacement);
fs.writeFileSync('routes/xl.js', c);
console.log('Patched routes/xl.js to enforce user locks during login.');
