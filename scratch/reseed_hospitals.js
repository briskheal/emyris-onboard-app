const axios = require('axios');
const XLSX = require('xlsx');

const API_BULK = 'https://emyrishr.in/api/admin/dcs/controls/bulk';
const API_DEL = 'https://emyrishr.in/api/admin/dcs/controls/bulk-hospitals';

async function wipeAndSeed() {
    console.log('Wiping all existing hospitals...');
    try {
        await axios.delete(API_DEL);
        console.log('Wiped successfully!');
    } catch(e) {
        console.log('Failed to wipe:', e.response ? e.response.status : e.message);
        return;
    }

    let allRecords = [];
    const processFile = (filename, type) => {
        try {
            const wb = XLSX.readFile(filename);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const rows = data.slice(1).filter(r => r && r.length > 0 && r[1] && typeof r[1] === 'string' && !r[1].startsWith('Date of File'));
            
            for (let r of rows) {
                let name = r[1].trim();
                let hq = null;

                if (type === 'Hospital' && name.includes(',')) {
                    const parts = name.split(',');
                    name = parts[0].trim();
                    hq = parts[1].trim();
                }

                allRecords.push({ type, name, hq, area: null, isActive: true });
            }
        } catch (e) {
            console.error(`Error in ${type}: ${e.message}`);
        }
    };

    console.log('Processing Excel file for Hospitals...');
    processFile('REPORTING MODULE/Hospitals.xlsx', 'Hospital');

    console.log(`Sending ${allRecords.length} records to LIVE server...`);
    try {
        const res = await axios.post(API_BULK, allRecords);
        console.log(`Successfully seeded ${res.data.count} hospitals!`);
    } catch (e) {
        console.error('Error during bulk seed:', e.response ? e.response.data : e.message);
    }
}

async function waitAndRun() {
    for(let i=0; i<30; i++) {
        try {
            console.log('Checking if backend deployed...');
            const res = await axios.delete(API_DEL);
            if(res.data.success) {
                console.log('API is ready! Running seed script...');
                await wipeAndSeed();
                return;
            }
        } catch(e) {
            console.log('Not ready yet:', e.response ? e.response.status : e.message);
        }
        await new Promise(r => setTimeout(r, 10000));
    }
}

waitAndRun();
