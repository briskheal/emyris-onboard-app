const fs = require('fs');
let admin = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', 'utf8');

const regexXl = /const xlUser = users\.find\(u => u\.email && u\.email\.toLowerCase\(\) === request\.employeeEmail\.toLowerCase\(\)\);/;
const replacementXl = `const lookupValXl = request.employeeEmail ? request.employeeEmail.toLowerCase() : '';
            const xlUser = users.find(u => 
                (u.email && u.email.toLowerCase() === lookupValXl) || 
                (u.uid && u.uid.toLowerCase() === lookupValXl) || 
                (u.employeeId && u.employeeId.toLowerCase() === lookupValXl)
            );`;

admin = admin.replace(regexXl, replacementXl);
fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', admin);
console.log("Patched admin.js to check uid!");
