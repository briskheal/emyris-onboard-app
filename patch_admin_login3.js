const fs = require('fs');

const file = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(file, 'utf8');

// The block starts exactly here:
const startMarker = `router.post('/login', loginLimiter, async (req, res) => {`;
const endMarker = `});\r\n\r\nrouter.get('/applicant-pin/:email'`;
let endMarkerUsed = endMarker;

let startIndex = content.indexOf(startMarker);
let endIndex = content.indexOf(endMarker);

if (endIndex === -1) {
    endMarkerUsed = `});\n\nrouter.get('/applicant-pin/:email'`;
    endIndex = content.indexOf(endMarkerUsed);
}

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `router.post('/login', loginLimiter, async (req, res) => {
    console.log(\`[LOGIN ATTEMPT] username: \${req.body.username}\`);
    const { username, password } = req.body;
    const adminUser = (process.env.ADMIN_USER || 'EMYRIS@BIOLIFE').toUpperCase();
    const adminPass = process.env.ADMIN_PASS || 'Omrutam@1306';
    const subAdminUser = (process.env.SUBADMIN_USER || 'ADMIN2').toUpperCase();
    const subAdminPass = process.env.SUBADMIN_PASS || '1234';

    if (username && username.toUpperCase() === adminUser && password === adminPass) {
        console.log(\`[LOGIN SUCCESS] \${req.body.username} (superadmin)\`);
        return res.status(200).json({ success: true, role: 'superadmin' });
    } else if (username && username.toUpperCase() === subAdminUser && password === subAdminPass) {
        console.log(\`[LOGIN SUCCESS] \${req.body.username} (subadmin)\`);
        return res.status(200).json({ success: true, role: 'subadmin' });
    }
    
    if (username && password) {
        try {
            const adminRecord = await XlAdmin.findOne({ where: { email: username, password: password } });
            if (adminRecord) {
                 console.log(\`[LOGIN SUCCESS] \${username} (db admin)\`);
                 return res.status(200).json({ success: true, role: 'admin', user: adminRecord });
            }
        } catch(e) {
            console.error("DB Admin lookup error", e);
        }
    }
    
    console.log(\`[LOGIN FAILED] \${req.body.username}\`);
    res.status(401).json({ success: false });
`;
    content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
    fs.writeFileSync(file, content);
    console.log("Successfully patched admin login route!");
} else {
    console.log("Could not find markers.", startIndex, endIndex);
}
