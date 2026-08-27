const xlsx = require('xlsx');
const axios = require('axios');

async function uploadHQs() {
  const wb = xlsx.readFile('d:/MY WORK FLOW/Emyris Onboard App/REPORTING MODULE/HQS.xlsx');
  const sheetName = wb.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
  
  console.log('Total HQs to process:', data.length);

  let successCount = 0;
  let failCount = 0;

  for (const row of data) {
    try {
      const stateName = row.State || row.state || row.STATE || row['State Name'] || row.stateName;
      const hqName = row.Headquarter || row.headquarter || row.HQ || row.hq || row['HQ Name'];

      if (!stateName || !hqName) {
         continue;
      }

      const res = await axios.post('https://emyrishr.in/api/admin/locations/hqs', { state: stateName, hqName });
      if (res.data.success) {
        successCount++;
        console.log('Live Upload Success:', hqName);
      } else {
        console.log('Live Upload Failed for', hqName, ':', res.data.message);
        failCount++;
      }
    } catch (e) {
      console.log('Live Upload Error for row', e.response?.data?.message || e.message);
      failCount++;
    }
  }

  console.log('Finished live processing. Success:', successCount, 'Failed:', failCount);
}

uploadHQs();
