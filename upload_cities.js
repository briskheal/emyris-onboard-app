const xlsx = require('xlsx');
const axios = require('axios');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'REPORTING MODULE', 'city-area.xlsx');

async function uploadCities() {
    try {
        console.log('Reading Excel file from:', FILE_PATH);
        const workbook = xlsx.readFile(FILE_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        console.log('Found ' + data.length + ' rows to process.');
        
        let successCount = 0;
        let failCount = 0;
        
        for (const row of data) {
            if (!row.City || !row.State || !row.HQ) {
                failCount++;
                continue;
            }
            
            const cityName = row.City.trim();
            const state = row.State.trim();
            const hq = row.HQ.toUpperCase().trim();
            const areaType = 'City';
            
            try {
                const res = await axios.post('https://emyrishr.in/api/admin/locations/cities', {
                    cityName, state, hq, areaType
                });
                if (res.data.success) {
                    process.stdout.write('? Synced: ' + cityName + ' (HQ: ' + hq + ')\n');
                    successCount++;
                } else {
                    process.stdout.write('? Failed: ' + cityName + '\n');
                    failCount++;
                }
            } catch (err) {
                process.stdout.write('? Error uploading ' + cityName + '\n');
                failCount++;
            }
        }
        console.log('\nUpload Complete! Success: ' + successCount + ', Failed: ' + failCount);
    } catch (e) {
        console.error('Fatal Error:', e.message);
    }
}

uploadCities();
