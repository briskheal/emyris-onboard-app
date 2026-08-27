const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('REPORTING MODULE', 'Doctor List-Alfez.xlsx');
const workbook = xlsx.readFile(filePath);
const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: null });

const codes = data.map(d => d['Doctor Code']);
const unique = new Set();
const duplicates = [];

for (let c of codes) {
    if (c && unique.has(c)) duplicates.push(c);
    else if (c) unique.add(c);
}
console.log('Duplicate Doctor Codes count:', duplicates.length);
