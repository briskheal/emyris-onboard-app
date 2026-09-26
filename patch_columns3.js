const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', 'utf8');

// For Secondary Sales
const oldSec = `'Secondary Sales': [
    { label: 'Creation Date +`', key: 'createdAt', isDate: true },
    { label: 'Invoice Number +`', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Month', key: 'month' },
    { label: 'Stockist', key: 'stockistName' },
    { label: 'Headquarter', key: 'hq' }
  ],`;

const newSec = `'Secondary Sales': [
    { label: 'Creation Date +`', key: 'createdAt', isDate: true },
    { label: 'Invoice Number +`', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Month', key: 'month' },
    { label: 'Stockist', key: 'stockist' },
    { label: 'Headquarter', key: 'headquarter' }
  ],`;

// Try to patch Secondary Sales
if (f.includes(oldSec)) {
    f = f.replace(oldSec, newSec);
} else {
    // If exact match fails, use regex
    f = f.replace(
        /'Secondary Sales': \[\s*\{ label: 'Creation Date[^\}]+\},\s*\{ label: 'Invoice Number[^\}]+\},\s*\{ label: 'Invoice Date'[^\}]+\},\s*\{ label: 'Created By'[^\}]+\},\s*\{ label: 'Month'[^\}]+\},\s*\{ label: 'Stockist', key: 'stockistName' \},\s*\{ label: 'Headquarter', key: 'hq' \}\s*\],/g,
        `'Secondary Sales': [
    { label: 'Creation Date', key: 'createdAt', isDate: true },
    { label: 'Invoice Number', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Month', key: 'month' },
    { label: 'Stockist', key: 'stockist' },
    { label: 'Headquarter', key: 'headquarter' }
  ],`
    );
}

// For Primary Sales
const oldPri = `'Primary Sales': [
    { label: 'Creation Date +`', key: 'createdAt', isDate: true },
    { label: 'Sales Date +`', key: 'salesDate', isDate: true },
    { label: 'Invoice Number +`', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Stockist', key: 'stockistName' },
    { label: 'Headquarter', key: 'hq' },
    
  ],`;

const newPri = `'Primary Sales': [
    { label: 'Creation Date +`', key: 'createdAt', isDate: true },
    { label: 'Sales Date +`', key: 'date', isDate: true },
    { label: 'Invoice Number +`', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Stockist', key: 'stockist' },
    { label: 'Headquarter', key: 'headquarter' }
  ],`;

if (f.includes(oldPri)) {
    f = f.replace(oldPri, newPri);
} else {
    f = f.replace(
        /'Primary Sales': \[\s*\{ label: 'Creation Date[^\}]+\},\s*\{ label: 'Sales Date[^\}]+\},\s*\{ label: 'Invoice Number[^\}]+\},\s*\{ label: 'Invoice Date'[^\}]+\},\s*\{ label: 'Created By'[^\}]+\},\s*\{ label: 'Stockist', key: 'stockistName' \},\s*\{ label: 'Headquarter', key: 'hq' \}[^\]]+\]/g,
        `'Primary Sales': [
    { label: 'Creation Date', key: 'createdAt', isDate: true },
    { label: 'Sales Date', key: 'date', isDate: true },
    { label: 'Invoice Number', key: 'invoiceNumber' },
    { label: 'Invoice Date', key: 'invoiceDate', isDate: true },
    { label: 'Created By', key: 'employeeName' },
    { label: 'Stockist', key: 'stockist' },
    { label: 'Headquarter', key: 'headquarter' }
  ]`
    );
}

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/GenericApproval.tsx', f);
console.log('Patched column mapping in GenericApproval.tsx');
