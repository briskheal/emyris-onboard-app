const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/Login.tsx';
let c = fs.readFileSync(path, 'utf8');

const oldLoginLine = `            localStorage.setItem('xl_user', JSON.stringify(res.data.user));
            navigate('/dashboard');`;

const newLoginLine = `            localStorage.setItem('xl_user', JSON.stringify(res.data.user));
            if (res.data.token) localStorage.setItem('xl_token', res.data.token);
            navigate('/dashboard');`;

c = c.replace(oldLoginLine, newLoginLine);
fs.writeFileSync(path, c);
console.log('XL Mobile Login patched to save JWT token.');
