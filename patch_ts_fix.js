const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/main.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/import axios from 'axios';\n/, '');
c = "import axios from 'axios';\n" + c;

c = c.replace(/axios\.interceptors\.request\.use\(\(config\) => \{/, "axios.interceptors.request.use((config: any) => {");
c = c.replace(/\}, \(error\) => Promise\.reject\(error\)\);/, "}, (error: any) => Promise.reject(error));");

fs.writeFileSync(path, c);

const path2 = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/main.tsx';
let c2 = fs.readFileSync(path2, 'utf8');

c2 = c2.replace(/import axios from 'axios';\n/, '');
c2 = "import axios from 'axios';\n" + c2;

c2 = c2.replace(/axios\.interceptors\.request\.use\(\(config\) => \{/, "axios.interceptors.request.use((config: any) => {");
c2 = c2.replace(/\}, \(error\) => Promise\.reject\(error\)\);/, "}, (error: any) => Promise.reject(error));");

fs.writeFileSync(path2, c2);

console.log('Fixed typescript imports and any types in both main.tsx');
