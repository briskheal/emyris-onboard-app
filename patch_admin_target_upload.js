const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

const regex = /const employeeId = row\['Employee UID'\];\s*if \(\!employeeId\) continue;/;
const replacement = `const empAlias = row['Employee UID'] || row['Employee ID'];
            if (!empAlias) continue;
            
            // Map the alias to the canonical employeeId
            const user = await XlUser.findOne({ where: { [Op.or]: [{ uid: empAlias }, { employeeId: empAlias }] } });
            const employeeId = user ? user.employeeId : empAlias;
            `;

c = c.replace(regex, replacement);

fs.writeFileSync('routes/admin.js', c);
console.log('Patched admin.js target upload to map uid to employeeId');
