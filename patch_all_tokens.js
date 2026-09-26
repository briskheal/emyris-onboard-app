const fs = require('fs');

// 1. Fix Backend Admin Login (routes/admin.js)
const adminJs = 'D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js';
let adminContent = fs.readFileSync(adminJs, 'utf8');

if (adminContent.includes("return res.status(200).json({ success: true, role: 'admin', user: adminRecord });")) {
    const fix = `
                   const jwt = require('jsonwebtoken');
                   const JWT_SECRET = process.env.JWT_SECRET || 'emyris_super_secret_key_2026';
                   const token = jwt.sign({ id: adminRecord._id, email: adminRecord.email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '30d' });
                   return res.status(200).json({ success: true, role: 'admin', user: adminRecord, token: token });
    `;
    adminContent = adminContent.replace("return res.status(200).json({ success: true, role: 'admin', user: adminRecord });", fix.trim());
    fs.writeFileSync(adminJs, adminContent);
    console.log("Patched admin.js token generation");
}

// 2. Fix XLA Frontend (Admin) Interceptors & Login
const xlaMain = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/main.tsx';
let xlaMainContent = fs.readFileSync(xlaMain, 'utf8');
xlaMainContent = xlaMainContent.replace(/localStorage\.getItem\('xl_token'\)/g, "localStorage.getItem('xla_token')");
xlaMainContent = xlaMainContent.replace(/localStorage\.removeItem\('xl_token'\)/g, "localStorage.removeItem('xla_token')");
fs.writeFileSync(xlaMain, xlaMainContent);
console.log("Patched xla-frontend main.tsx interceptors");

const xlaLogin = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Login.tsx';
let xlaLoginContent = fs.readFileSync(xlaLogin, 'utf8');
xlaLoginContent = xlaLoginContent.replace("localStorage.setItem('xla_token', 'true');", "localStorage.setItem('xla_token', res.data.token || 'true');");
fs.writeFileSync(xlaLogin, xlaLoginContent);
console.log("Patched xla-frontend Login.tsx token saving");

// 3. Fix XL Frontend (User) Interceptor compatibility
const xlMain = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/main.tsx';
let xlMainContent = fs.readFileSync(xlMain, 'utf8');
const xlFix = `
axios.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('xl_token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
}, (error: any) => Promise.reject(error));
`;
// Replace the old request interceptor
xlMainContent = xlMainContent.replace(/axios\.interceptors\.request\.use\([\s\S]*?Promise\.reject\(error\)\);/, xlFix.trim());
fs.writeFileSync(xlMain, xlMainContent);
console.log("Patched xl-frontend main.tsx interceptors");

