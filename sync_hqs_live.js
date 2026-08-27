const axios = require('axios');

const BASE_URL = 'https://emyrishr.in/api/admin';

async function syncHQs() {
  try {
    console.log('Fetching XLA HQs...');
    const xlaRes = await axios.get(`${BASE_URL}/locations/hqs`);
    
    if (!xlaRes.data.success) {
        console.log('Failed to fetch XLA HQs');
        return;
    }
    
    const xlaHQs = xlaRes.data.hqs;
    console.log(`Found ${xlaHQs.length} XLA HQs.`);

    let updatedXLA = 0;
    let syncedToOld = 0;

    for (const hq of xlaHQs) {
        const uppercaseName = hq.hqName.toUpperCase().trim();
        
        // 1. Capitalize in XLA table if needed
        if (hq.hqName !== uppercaseName) {
            try {
                await axios.put(`${BASE_URL}/locations/hqs/${hq._id}`, { hqName: uppercaseName });
                updatedXLA++;
                console.log(`Uppercase updated in XLA: ${hq.hqName} -> ${uppercaseName}`);
            } catch(e) {
                console.log(`Failed to update XLA HQ ${hq.hqName}`);
            }
        }

        // 2. Push to Old HQ Table
        try {
            await axios.post(`${BASE_URL}/hqs`, { name: uppercaseName });
            syncedToOld++;
            console.log(`Synced to Admin Portal: ${uppercaseName}`);
        } catch(e) {
            console.log(`Failed to sync to Admin Portal: ${uppercaseName}`);
        }
    }

    console.log(`\nSync Complete!`);
    console.log(`- XLA HQs Uppercased: ${updatedXLA}`);
    console.log(`- HQs Pushed to Admin Portal: ${syncedToOld}`);

  } catch (error) {
      console.error('Error during sync:', error.message);
  }
}

syncHQs();
