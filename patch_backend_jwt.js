const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let c = fs.readFileSync(path, 'utf8');

// Insert JWT and verifyToken middleware at the top
const verifyTokenCode = `
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'emyris_super_secret_key_2026';

const verifyToken = (req, res, next) => {
    const openRoutes = [
        '/api/xl/login', '/login', 
        '/api/xl/admin-login', '/admin-login', 
        '/api/xl/register', '/register',
        '/company-profile'
    ];
    if (openRoutes.includes(req.path) || req.path.includes('/cleanup-') || req.path.includes('/debug-')) {
        return next();
    }
    
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token format' });
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Forbidden: Invalid or expired token' });
        req.user = decoded;
        next();
    });
};

router.use(verifyToken);

// [NEW] Admin Login Route
router.post('/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.json({ success: false, message: 'Email and password required' });
        
        const { XlAdmin } = require('../db');
        const admin = await XlAdmin.findOne({ where: { email, password } });
        
        if (!admin) return res.json({ success: false, message: 'Invalid admin credentials' });
        
        const adminData = admin.toJSON();
        delete adminData.password;
        
        const token = jwt.sign({ id: admin._id, email: admin.email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ success: true, user: adminData, token });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
`;

// Insert the code right after router initialization
c = c.replace(/const router = express\.Router\(\);/, 'const router = express.Router();\n' + verifyTokenCode);

// Update /login route to issue JWT
const oldLogin = /router\.post\('\/login',\s*async\s*\(req,\s*res\)\s*=>\s*\{([\s\S]*?)const\s*userData\s*=\s*user\.toJSON\(\);\s*delete\s*userData\.password;\s*res\.json\(\{ success: true, user: userData \}\);/;
const newLogin = `router.post('/login', async (req, res) => {$1const userData = user.toJSON();
        delete userData.password;
        const token = jwt.sign({ id: user._id, employeeId: user.employeeId, role: user.designation }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ success: true, user: userData, token });`;

c = c.replace(oldLogin, newLogin);

fs.writeFileSync(path, c);
console.log('Backend Auth Overhaul completed.');
