const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let f = fs.readFileSync(path, 'utf8');

// Fix the undefined 'status' variable in POST routes
f = f.replace(
    "const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData } = req.body;",
    "const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;"
);

f = f.replace(
    "const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, chemist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData } = req.body;",
    "const { employeeId, date, invoiceDate, invoiceNumber, division, headquarter, stockist, chemist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;"
);

fs.writeFileSync(path, f);
console.log('Fixed ReferenceError in routes/xl.js');
