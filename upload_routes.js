const xlsx = require('xlsx');
const axios = require('axios');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'REPORTING MODULE', 'routes.xlsx');

async function uploadRoutes() {
    try {
        console.log('Reading routes file from:', FILE_PATH);
        const workbook = xlsx.readFile(FILE_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        console.log('Found ' + data.length + ' rows to process.');
        
        let successCount = 0;
        let failCount = 0;
        
        for (const row of data) {
            if (!row['From City'] || !row['To City'] || !row['Area Type'] || row['Distance'] === undefined) {
                failCount++;
                continue;
            }
            
            const fromCity = String(row['From City']).trim();
            const toCity = String(row['To City']).trim();
            const hq = row.HQ ? String(row.HQ).trim() : '';
            const state = row.State ? String(row.State).trim() : '';
            const areaType = String(row['Area Type']).trim();
            const distance = Number(row['Distance']) || 0;
            
            try {
                const res = await axios.post('https://emyrishr.in/api/admin/locations/routes', {
                    state, hq, fromCity, toCity, areaType, distance
                });
                if (res.data.success) {
                    process.stdout.write('? Synced: ' + fromCity + ' -> ' + toCity + ' (' + distance + 'km)\n');
                    successCount++;
                } else {
                    process.stdout.write('? Failed: ' + fromCity + ' -> ' + toCity + '\n');
                    failCount++;
                }
            } catch (err) {
                process.stdout.write('? Error uploading ' + fromCity + ' -> ' + toCity + '\n');
                failCount++;
            }
        }
        console.log('\nUpload Complete! Success: ' + successCount + ', Failed: ' + failCount);
    } catch (e) {
        console.error('Fatal Error:', e.message);
    }
}

uploadRoutes();
