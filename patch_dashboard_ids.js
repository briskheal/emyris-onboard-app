const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const regex = /let whereUser = \{\};\s*if \(employeeId\) \{\s*whereUser\.employeeId = employeeId;\s*\}/;

const replacement = `let whereUser = {};
        if (employeeId) {
            const user = await XlUser.findOne({
                where: {
                    [Op.or]: [
                        { _id: employeeId },
                        { uid: employeeId },
                        { employeeId: employeeId }
                    ]
                }
            });
            if (user) {
                const userKeys = [user._id, user.uid, user.employeeId].filter(Boolean);
                whereUser.employeeId = { [Op.in]: userKeys };
            } else {
                whereUser.employeeId = employeeId;
            }
        }`;

c = c.replace(regex, replacement);

fs.writeFileSync('routes/xl.js', c);
console.log('Patched dashboard stats to handle multiple user ID formats');
