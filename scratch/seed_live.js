const axios = require('axios');
const XLSX = require('xlsx');

const API_URL = 'https://emyrishr.in/api/admin/dcs/controls';

async function seedLive() {
    const insertFile = async (filename, type) => {
        try {
            const wb = XLSX.readFile(filename);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const rows = data.slice(1).filter(r => r && r.length > 0 && r[1] && typeof r[1] === 'string' && !r[1].startsWith('Date of File'));
            
            let count = 0;
            for (let r of rows) {
                let name = r[1].trim();
                let location = null;

                if (type === 'Hospital' && name.includes(',')) {
                    const parts = name.split(',');
                    name = parts[0].trim();
                    location = parts[1].trim();
                }

                await axios.post(API_URL, { type, name, location, isActive: true });
                count++;
            }
            console.log(`Seeded ${count} ${type}s to LIVE server`);
        } catch (e) {
            console.error(`Error in ${type}: ${e.message}`);
        }
    };

    console.log('Starting live DB seed...');
    await insertFile('REPORTING MODULE/Category.xlsx', 'Category');
    await insertFile('REPORTING MODULE/Degree.xlsx', 'Degree');
    await insertFile('REPORTING MODULE/Specialization.xlsx', 'Specialization');
    await insertFile('REPORTING MODULE/Hospitals.xlsx', 'Hospital');
}

seedLive().then(() => {
    console.log('Live seeding complete!');
    process.exit(0);
});
