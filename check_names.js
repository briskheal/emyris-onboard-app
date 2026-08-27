const xlsx = require('xlsx');
const path = require('path');
const filePath = path.join('REPORTING MODULE', 'Doctor List-Alfez.xlsx');
const data = xlsx.utils.sheet_to_json(xlsx.readFile(filePath).Sheets[xlsx.readFile(filePath).SheetNames[0]], { defval: null });

const emptyNames = data.filter(d => !d.Name && !d.name);
console.log('Empty Names:', emptyNames.length);
if (emptyNames.length > 0) console.log(emptyNames);
