const fs = require('fs');
let c = fs.readFileSync('routes/migrate.js', 'utf8');

const regex = /res\.json\(\{/;
const replacement = `
        for (const user of users) {
            if (!user.employeeId) continue;
            const aliases = [];
            if (user.uid && user.uid !== user.employeeId) aliases.push(user.uid);
            if (user._id && user._id !== user.employeeId) aliases.push(user._id);
            if (aliases.length === 0) continue;
            
            const clientTables = [XlDoctor, XlChemist, XlStockist];
            for (const Table of clientTables) {
                if (Table) {
                    try {
                        const [updatedRows] = await Table.update(
                            { userAllotted: user.employeeId },
                            { where: { userAllotted: { [Op.in]: aliases } } }
                        );
                        if (updatedRows > 0) {
                            logs.push(\`Updated \${updatedRows} userAllotted rows in \${Table.name} for user \${user.firstName} to \${user.employeeId}\`);
                            totalUpdated += updatedRows;
                        }
                    } catch (e) {}
                }
            }
        }
        res.json({`;

c = c.replace(regex, replacement);
fs.writeFileSync('routes/migrate.js', c);
console.log('Added userAllotted to migration endpoint');
