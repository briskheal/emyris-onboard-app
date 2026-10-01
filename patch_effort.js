const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

const regex = /const dcrs = await XlDCR.findAll\(\{ where: \{ employeeId: user.employeeId \|\| null, month, year \} \}\);[\s\S]*?let totalDoctorsMet = 0;[\s\S]*?let totalUniqueDoctors = new Set\(\);[\s\S]*?dcrs.forEach\(dcr => \{[\s\S]*?if \(dcr.doctorsData\) \{[\s\S]*?try \{[\s\S]*?const docs = JSON.parse\(dcr.doctorsData\);[\s\S]*?docs.forEach\(doc => \{[\s\S]*?if \(doc.uid\) \{[\s\S]*?totalDoctorsMet\+\+;[\s\S]*?totalUniqueDoctors.add\(doc.uid\);[\s\S]*?\}[\s\S]*?\}\);[\s\S]*?\} catch\(e\) \{\}[\s\S]*?\}[\s\S]*?\}\);/;

const replacement = `const monthNum = String(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1).padStart(2, '0');
            const datePrefix = \`\${year}-\${monthNum}-\`;
            const { Op } = require('sequelize');
            const dcrs = await XlDCR.findAll({ 
                where: { 
                    employeeId: user.employeeId || null, 
                    date: { [Op.like]: \`\${datePrefix}%\` } 
                } 
            });

            let totalDoctorsMet = 0;
            let totalUniqueDoctors = new Set();
            dcrs.forEach(dcr => {
                if (dcr.entityType === 'Doctor' && dcr.status === 'Approved') {
                    totalDoctorsMet++;
                    if (dcr.entityId) {
                        totalUniqueDoctors.add(dcr.entityId);
                    }
                }
            });`;

if (c.match(regex)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('routes/xl.js', c);
    console.log('Fixed Effort Analysis');
} else {
    console.log('Regex did not match');
}
