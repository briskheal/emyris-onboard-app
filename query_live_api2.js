const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/attendance/monthly/all?month=09&year=2026&rand=' + Date.now());
        const data = res.data.data;
        console.log('Total Atts:', data.length);
    } catch(e) { 
        if (e.response && e.response.data) {
            console.error('API Error:', e.response.data);
        } else {
            console.error('API Error:', e.message);
        }
    }
}
run();
