const fs = require('fs');

function injectInterceptor(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');
    
    // Check if axios is imported
    if (!c.includes("import axios from 'axios'")) {
        // Find the last import and append axios
        c = c.replace(/import [^;]+;\n(?!import)/, "$&\nimport axios from 'axios';\n");
    }

    const interceptorCode = `
// Global Axios Interceptor for JWT
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('xl_token');
    if (token && config.headers) {
        config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
}, (error) => Promise.reject(error));
`;

    if (!c.includes('axios.interceptors.request.use')) {
        // Insert right before ReactDOM.createRoot
        c = c.replace(/ReactDOM\.createRoot/, interceptorCode + '\nReactDOM.createRoot');
        fs.writeFileSync(filePath, c);
        console.log('Interceptor injected in', filePath);
    } else {
        console.log('Interceptor already exists in', filePath);
    }
}

injectInterceptor('D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/main.tsx');
injectInterceptor('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/main.tsx');
