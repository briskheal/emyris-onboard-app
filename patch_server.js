const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');
const mw = `
// Middleware to convert incoming DD-MM-YYYY dates to YYYY-MM-DD
app.use((req, res, next) => {
    const dateRegex = /^(\\d{1,2})-(\\d{1,2})-(\\d{4})$/;
    const convertDates = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (let key in obj) {
            if (typeof obj[key] === 'string' && dateRegex.test(obj[key])) {
                const [_, d, m, y] = obj[key].match(dateRegex);
                obj[key] = \`\${y}-\${m.padStart(2, '0')}-\${d.padStart(2, '0')}\`;
            } else if (typeof obj[key] === 'object') {
                convertDates(obj[key]);
            }
        }
    };
    convertDates(req.body);
    convertDates(req.query);
    next();
});
`;
c = c.replace("app.use(express.json({ limit: '50mb' }));", "app.use(express.json({ limit: '50mb' }));" + mw);
fs.writeFileSync('server.js', c);
console.log('Added middleware');
