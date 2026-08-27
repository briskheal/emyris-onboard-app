const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join('REPORTING MODULE', 'Doctor List-Alfez.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

const uids = data.map(d => d.UID);
const unique = new Set();
const duplicates = [];

for (let uid of uids) {
    if (unique.has(uid)) duplicates.push(uid);
    else unique.add(uid);
}

console.log('Total Rows:', data.length);
console.log('Duplicate UIDs count:', duplicates.length);
if (duplicates.length > 0) console.log('Some Duplicates:', duplicates.slice(0, 10));

const emptyUids = data.filter(d => !d.UID);
console.log('Empty UIDs count:', emptyUids.length);
