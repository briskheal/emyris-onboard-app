const fs = require('fs');

let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

file = file.replace(/const xlUser = users\.find\(u => u\.email && u\.email\.toLowerCase\(\) === record\.employeeId\.toLowerCase\(\)\);/g, `
    const lookupValRecord = record.employeeId ? record.employeeId.toLowerCase() : '';
    const xlUser = users.find(u => 
        (u.email && u.email.toLowerCase() === lookupValRecord) || 
        (u.uid && u.uid.toLowerCase() === lookupValRecord) || 
        (u.employeeId && u.employeeId.toLowerCase() === lookupValRecord)
    );
`);

file = file.replace(/const xlUser = users\.find\(u => u\.email && u\.email\.toLowerCase\(\) === leave\.employeeId\.toLowerCase\(\)\);/g, `
    const lookupValLeave = leave.employeeId ? leave.employeeId.toLowerCase() : '';
    const xlUser = users.find(u => 
        (u.email && u.email.toLowerCase() === lookupValLeave) || 
        (u.uid && u.uid.toLowerCase() === lookupValLeave) || 
        (u.employeeId && u.employeeId.toLowerCase() === lookupValLeave)
    );
`);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', file);
console.log("Patched missing hooks in routes/xl.js!");
