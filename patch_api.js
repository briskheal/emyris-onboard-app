const fs = require('fs');

let code = fs.readFileSync('routes/admin.js', 'utf8');

// Fix GET /api/company-profile -> GET /company-profile
code = code.replace(/router\.get\('\/api\/company-profile'/g, "router.get('/company-profile'");

// Add POST /company-profile right after the GET
const insertStr = `
router.post('/company-profile', async (req, res) => {
    try {
        const updateData = req.body;
        // Don't allow overwriting _id or active
        delete updateData._id;
        
        let profile = await Company.findOne();
        if (!profile) {
            await Company.create({ name: "EMYRIS BIOLIFESCIENCES PVT LTD.", ...updateData });
        } else {
            await Company.updateOne({ _id: profile._id }, { $set: updateData });
        }
        res.json({ success: true, message: 'Profile updated' });
    } catch (e) {
        console.error('Company Profile Update Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});
`;

if (!code.includes("router.post('/company-profile'")) {
    const splitPoint = "router.get('/api/company-data'";
    const parts = code.split(splitPoint);
    if (parts.length === 2) {
        code = parts[0] + insertStr + "\n" + splitPoint + parts[1];
    }
}

fs.writeFileSync('routes/admin.js', code);
console.log('Patched routes/admin.js successfully.');
