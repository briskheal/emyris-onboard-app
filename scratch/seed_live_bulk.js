const axios = require('axios');
const XLSX = require('xlsx');

const API_URL = 'https://emyrishr.in/api/admin/dcs/controls/bulk';

async function seedLiveBulk() {
    let allRecords = [];

    const processFile = (filename, type) => {
        try {
            const wb = XLSX.readFile(filename);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const rows = data.slice(1).filter(r => r && r.length > 0 && r[1] && typeof r[1] === 'string' && !r[1].startsWith('Date of File'));
            
            for (let r of rows) {
                let name = r[1].trim();
                let location = null;

                if (type === 'Hospital' && name.includes(',')) {
                    const parts = name.split(',');
                    name = parts[0].trim();
                    location = parts[1].trim();
                }

                allRecords.push({ type, name, location, isActive: true });
            }
        } catch (e) {
            console.error(`Error in ${type}: ${e.message}`);
        }
    };

    console.log('Processing files...');
    processFile('REPORTING MODULE/Category.xlsx', 'Category');
    processFile('REPORTING MODULE/Degree.xlsx', 'Degree');
    processFile('REPORTING MODULE/Specialization.xlsx', 'Specialization');
    processFile('REPORTING MODULE/Hospitals.xlsx', 'Hospital');

    console.log(`Sending ${allRecords.length} records to LIVE server...`);
    
    // We will wipe existing via a small script if needed, or just insert the missing ones.
    // Wait, the previous script might have inserted Category, Degree, Specialization, and failed halfway through Hospital.
    // If I just bulkInsert everything, we will have duplicates.
    // Let me fetch existing first.
    
    try {
        const existingRes = await axios.get('https://emyrishr.in/api/admin/dcs/controls');
        const existing = existingRes.data.controls || [];
        const existingNames = new Set(existing.map(x => x.name));

        const newRecords = allRecords.filter(x => !existingNames.has(x.name));
        
        console.log(`Found ${existing.length} existing. Sending ${newRecords.length} new records...`);
        
        if (newRecords.length > 0) {
            const res = await axios.post(API_URL, newRecords);
            console.log(`Successfully bulk seeded ${res.data.count} records!`);
        } else {
            console.log('Nothing new to seed.');
        }
    } catch (e) {
        console.error('Error during bulk seed:', e.response ? e.response.data : e.message);
    }
}

seedLiveBulk().then(() => {
    console.log('Done!');
    process.exit(0);
});
