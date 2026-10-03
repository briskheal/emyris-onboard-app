const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

// Remove the "/api/xl/debug-user" entry that was injected into openRoutes
c = c.replace('const openRoutes = ["/api/xl/debug-user", \n    ', 'const openRoutes = [\n    ');

fs.writeFileSync('routes/xl.js', c);
console.log('DONE: Cleaned openRoutes injection');

// Verify
const check = fs.readFileSync('routes/xl.js', 'utf8');
if (check.includes('/api/xl/debug-user')) {
    console.log('WARNING: debug-user still present');
} else {
    console.log('VERIFIED: openRoutes is clean');
}
