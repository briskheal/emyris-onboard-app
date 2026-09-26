const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/attendance/monthly/all?month=09&year=2026');
        console.log(res.data.data.filter(d => d.punchInTime === 'DCR Submitted').length, "DCRs injected");
    } catch(e) { }
}
run();
