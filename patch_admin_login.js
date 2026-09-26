const fs = require('fs');

const file = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let content = fs.readFileSync(file, 'utf8');

const target = `    if (username && username.toUpperCase() === adminUser && password === adminPass) {
        console.log(\`[LOGIN SUCCESS] \${req.body.username} (superadmin)\`);
        res.status(200).json({ success: true, role: 'superadmin' });
    } else if (username && username.toUpperCase() === subAdminUser && password === subAdminPass) {
        console.log(\`[LOGIN SUCCESS] \${req.body.username} (subadmin)\`);
        res.status(200).json({ success: true, role: 'subadmin' });
    } else {
        console.log(\`[LOGIN FAILED] \${req.body.username}\`);
        res.status(401).json({ success: false });
    }`;

const replacement = `    if (username && username.toUpperCase() === adminUser && password === adminPass) {
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
    res.status(401).json({ success: false });`;

if (content.includes("res.status(401).json({ success: false });")) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log("Patched admin.js /login route");
} else {
    console.log("Could not find target block");
}
