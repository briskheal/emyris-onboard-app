const fs = require('fs');

const targetFile = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = "res.json({ success: true, message: 'Login successful', user: userData });";
const replacementStr = `
        const token = jwt.sign({ id: user._id, email: user.email, role: 'USER' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ success: true, message: 'Login successful', user: userData, token });
`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr.trim());
    fs.writeFileSync(targetFile, content);
    console.log("Successfully patched /api/xl/login to return JWT token!");
} else {
    console.log("Could not find the target string!");
}
