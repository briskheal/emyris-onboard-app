const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js';
let f = fs.readFileSync(path, 'utf8');

// Patch primary-sales
f = f.replace(
    "const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData } = req.body;",
    "const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;"
);

f = f.replace(
    "productsData: JSON.stringify(productsData)",
    "productsData: JSON.stringify(productsData),\n            ...(status ? { status } : {})"
);

// Patch secondary-sales
f = f.replace(
    "const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, chemist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData } = req.body;",
    "const { date, invoiceDate, invoiceNumber, division, headquarter, stockist, chemist, grossInvValue, netInvValue, salableRtnValue, expiryRtnValue, productsData, status } = req.body;"
);

fs.writeFileSync(path, f);
console.log('routes/xl.js patched to handle status in PUT endpoints');
