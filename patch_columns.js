const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', 'utf8');

const oldConfig = `'Secondary Sales': [
    { label: 'Creation Date +`', key: 'createdAt', isDate: true },
    { label: 'Invoice Number +`', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Month +`', key: 'month' },
    { label: 'Stockist', key: 'stockistName' },
    { label: 'Headquarter', key: 'hq' },
    { label: 'Total Quantity', key: 'totalQty' },
    { label: 'Sales Quantity', key: 'salesQty' }
  ],
  'Primary Sales': [
    { label: 'Creation Date +`', key: 'createdAt', isDate: true },
    { label: 'Sales Date +`', key: 'salesDate', isDate: true },
    { label: 'Invoice Number +`', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Stockist', key: 'stockistName' },
    { label: 'Headquarter', key: 'hq' },
    { label: 'Units', key: 'units' },
    { label: 'Quantity', key: 'quantity' },
    { label: 'Free Stock', key: 'freeStock' },
    { label: 'Total Quantity', key: 'totalQty' },
    { label: 'Final Price', key: 'finalPrice' },
    { label: 'Return Value', key: 'returnValue' }
  ],`;

const newConfig = `'Secondary Sales': [
    { label: 'Creation Date +`', key: 'createdAt', isDate: true },
    { label: 'Invoice Number +`', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Month +`', key: 'month' },
    { label: 'Stockist', key: 'stockistName' },
    { label: 'Headquarter', key: 'hq' }
  ],
  'Primary Sales': [
    { label: 'Creation Date +`', key: 'createdAt', isDate: true },
    { label: 'Invoice Number +`', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Stockist', key: 'stockistName' },
    { label: 'Headquarter', key: 'hq' }
  ],`;

f = f.replace(oldConfig, newConfig);
fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', f);
console.log('Patched GenericApproval.tsx config');
