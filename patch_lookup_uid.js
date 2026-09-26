const fs = require('fs');
let xl = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const regex = /const xlUser = users\.find\(u => u\.email && u\.email\.toLowerCase\(\) === ([^.]+)\.toLowerCase\(\)\);/g;

xl = xl.replace(regex, (match, varName) => {
    return `const lookupVal = ${varName} ? ${varName}.toLowerCase() : '';
            const xlUser = users.find(u => 
                (u.email && u.email.toLowerCase() === lookupVal) || 
                (u.uid && u.uid.toLowerCase() === lookupVal) || 
                (u.employeeId && u.employeeId.toLowerCase() === lookupVal)
            );`;
});

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', xl);
console.log("Patched xl.js to check uid, email, and employeeId!");
