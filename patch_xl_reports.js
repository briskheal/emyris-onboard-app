const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const regex = /const \{ employeeId \} = req\.query;\s*let where = \{\};\s*if \(employeeId\) \{/g;
const replacement = `const { employeeId, hq } = req.query;
        let where = {};
        if (hq) {
            where.headquarter = hq;
        } else if (employeeId) {`;

c = c.replace(regex, replacement);
fs.writeFileSync('routes/xl.js', c);
console.log('Patched routes/xl.js');
