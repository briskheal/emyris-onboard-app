const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('REPORTING MODULE', 'Doctor List-Alfez.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

console.log('Total Rows:', data.length);
if (data.length > 0) {
    console.log('Headers:', Object.keys(data[0]));
    console.log('First Row:', data[0]);
    console.log('Last Row:', data[data.length - 1]);
}
