const fs = require('fs');
let c = fs.readFileSync('routes/applicant.js', 'utf8');

// Find the login route and replace everything from router.post('/login' to the closing });
// We'll replace the entire login route with a clean Sequelize version

const loginRouteStart = c.indexOf("router.post('/login'");
const loginRouteEnd = c.indexOf('\nrouter.get(\'/test-questions\'');

if (loginRouteStart === -1 || loginRouteEnd === -1) {
    console.log('Could not find login route boundaries');
    console.log('Looking for:', "router.post('/login'");
    console.log('Found at:', loginRouteStart);
    console.log('End at:', loginRouteEnd);
    process.exit(1);
}

const newLoginRoute = `router.post('/login', async (req, res) => {
    try {
        let { email, password, pin } = req.body;
        password = password || pin;
        email = (email || "").toString().toLowerCase().trim();
        password = (password || "").toString().trim();

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and PIN are required.' });
        }

        const applicant = await Applicant.findOne({ where: { email } });

        if (!applicant) {
            return res.status(401).json({ success: false, message: 'Invalid Email or PIN.' });
        }

        const dbPin = String(applicant.password || "").trim();
        if (dbPin !== password) {
            console.log('LOGIN FAIL:', email);
            return res.status(401).json({ success: false, message: 'Invalid Email or PIN.' });
        }

        console.log('LOGIN SUCCESS:', email);

        res.status(200).json({
            success: true,
            applicant: {
                fullName: applicant.fullName,
                email: applicant.email,
                phone: applicant.phone,
                status: applicant.status,
                canLogin: applicant.canLogin,
                formData: applicant.formData || {},
                documents: applicant.documents || [],
                verificationChecks: applicant.verificationChecks || {},
                salaryBreakup: applicant.salaryBreakup || {},
                tasks: applicant.tasks || {},
                division: applicant.division,
                designation: applicant.designation,
                hq: applicant.hq,
                refNo: applicant.refNo,
                actualJoiningDate: applicant.actualJoiningDate,
                offerAccepted: applicant.offerAccepted,
                isExistingStaff: applicant.isExistingStaff,
                rapidTestCompleted: applicant.rapidTestCompleted
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, message: 'Login error. Please try again.' });
    }
});
`;

const before = c.substring(0, loginRouteStart);
const after = c.substring(loginRouteEnd);
const result = before + newLoginRoute + after;

fs.writeFileSync('routes/applicant.js', result);
console.log('Login route replaced successfully!');
console.log('New login route starts at char:', loginRouteStart);
