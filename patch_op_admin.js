const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(/const user = await XlUser\.findOne\(\{ where\: \{ \[Op\.or\]\: \[\{ uid\: empAlias \}, \{ employeeId\: empAlias \}\] \} \}\);/, 
`const { Op } = require('sequelize');
            const user = await XlUser.findOne({ where: { [Op.or]: [{ uid: empAlias }, { employeeId: empAlias }] } });`);

fs.writeFileSync('routes/admin.js', c);
console.log('Injected Op into admin.js target uploader');
