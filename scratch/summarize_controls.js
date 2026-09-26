const XLSX = require('xlsx');

function summarize(file) {
    try {
        const wb = XLSX.readFile(file);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        // Assume first row is header, rest is data
        const rows = data.slice(1).filter(r => r && r.length > 0 && r[0]);
        console.log(`\nFile: ${file}`);
        console.log(`Total Entries: ${rows.length}`);
        console.log(`First 5 entries:`);
        rows.slice(0, 5).forEach(r => console.log(` - ${r.join(' | ')}`));
    } catch (e) {
        console.error(`Error reading ${file}: ${e.message}`);
    }
}

summarize('REPORTING MODULE/Category.xlsx');
summarize('REPORTING MODULE/Degree.xlsx');
summarize('REPORTING MODULE/Hospitals.xlsx');
summarize('REPORTING MODULE/Specialization.xlsx');
