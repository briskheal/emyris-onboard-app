const axios = require('axios');

const BASE_URL = 'https://emyrishr.in/api/admin';

const adminDesignations = [
  { title: 'Territory Business Manager', department: 'SALES', level: 1 },
  { title: 'Area Sales Manager', department: 'SALES', level: 2 },
  { title: 'Regional Sales Manager', department: 'SALES', level: 3 },
  { title: 'Sr. Regional Sales Manager', department: 'SALES', level: 4 },
  { title: 'Zonal Sales Manager', department: 'SALES', level: 5 },
  { title: 'Sr. Zonal Sales Manager', department: 'SALES', level: 6 },
  { title: 'Sales Manager', department: 'SALES', level: 7 },
  { title: 'National Sales Manager', department: 'SALES', level: 8 },
  { title: 'General Manager (Sales & Mktng)', department: 'SALES', level: 9 }
];

async function syncDesignations() {
  let successCount = 0;
  for (const d of adminDesignations) {
    try {
        const res = await axios.post(`${BASE_URL}/locations/designations`, {
            designationName: d.title,
            level: d.level,
            dailyAllowance: 0,
            exStationAllowance: 0,
            outStationAllowance: 0
        });
        if (res.data.success) {
            console.log(`Synced to XLA: ${d.title} (Level ${d.level})`);
            successCount++;
        }
    } catch(e) {
        console.error(`Failed to sync ${d.title}:`, e.response?.data?.message || e.message);
    }
  }
  console.log(`\nSuccessfully synced ${successCount} designations to XLA Portal.`);
}

syncDesignations();
