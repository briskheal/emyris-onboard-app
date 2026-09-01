const xlsx = require('xlsx');
const workbook = xlsx.readFile('REPORTING MODULE/routes.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);
console.log('Headers:', Object.keys(data[0] || {}));
console.log('First 3 rows:', data.slice(0, 3));
