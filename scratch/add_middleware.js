const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const middleware = `
// Middleware to block locked users from any mobile API route instantly
router.use(async (req, res, next) => {
    const empId = req.body.employeeId || req.query.employeeId || req.body.email || req.query.email;
    if (empId) {
        try {
            const user = await XlUser.findOne({ 
                where: { 
                    [Op.or]: [
                        { employeeId: empId },
                        { email: empId },
                        { uid: empId }
                    ]
                }
            });
            if (user) {
                let controls = user.controls;
                if (typeof controls === 'string') {
                    try { controls = JSON.parse(controls); } catch(e) { controls = {}; }
                }
                if (controls && controls.locked) {
                    return res.json({ 
                        success: false, 
                        isLocked: true, // Special flag for mobile app if it wants to log out
                        message: controls.lockedReason || 'Your account is locked by Admin.' 
                    });
                }
            }
        } catch(e) {
            console.error('Lock Check Error:', e);
        }
    }
    next();
});
`;

c = c.replace(
    "const { Op } = require('sequelize');", 
    "const { Op } = require('sequelize');\n" + middleware
);

fs.writeFileSync('routes/xl.js', c);
console.log("Added global lock middleware to routes/xl.js");
