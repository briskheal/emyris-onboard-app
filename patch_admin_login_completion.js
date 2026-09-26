const fs = require('fs');

// PATCH 1: Backend /admin-login to use .env MASTER ADMIN
const backendPath = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let backendCode = fs.readFileSync(backendPath, 'utf8');

const oldAdminLogin = `        const { XlAdmin } = require('../db');
        const admin = await XlAdmin.findOne({ where: { email, password } });`;

const newAdminLogin = `        // Master Admin Check
        if (email === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
            const token = jwt.sign({ id: 'MASTER_ADMIN', email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '30d' });
            return res.json({ success: true, user: { firstName: 'Super', lastName: 'Admin', designation: 'ADMIN', email }, token });
        }
        
        const { XlAdmin } = require('../db');
        const admin = await XlAdmin.findOne({ where: { email, password } });`;

backendCode = backendCode.replace(oldAdminLogin, newAdminLogin);
fs.writeFileSync(backendPath, backendCode);
console.log('Backend /admin-login patched with master credentials.');


// PATCH 2: Frontend 401 Interceptors
function injectResponseInterceptor(filePath, loginUrl) {
    let c = fs.readFileSync(filePath, 'utf8');
    
    const responseInterceptor = `
// Global Response Interceptor for 401 Unauthorized
axios.interceptors.response.use((response) => response, (error) => {
    if (error.response && (error.response.status === 401)) {
        localStorage.removeItem('xl_token');
        localStorage.removeItem('user');
        localStorage.removeItem('xl_user');
        window.location.href = '${loginUrl}';
    }
    return Promise.reject(error);
});
`;

    if (!c.includes('axios.interceptors.response.use')) {
        c = c.replace(/ReactDOM\.createRoot/, responseInterceptor + '\nReactDOM.createRoot');
        fs.writeFileSync(filePath, c);
        console.log('Response interceptor injected in', filePath);
    }
}

injectResponseInterceptor('D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/main.tsx', '/xl/login');
injectResponseInterceptor('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/main.tsx', '/xla/login');

