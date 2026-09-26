const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/attendance/monthly/all?month=09&year=2026&rand=' + Date.now());
        console.log("workingDays:", res.data.workingDays);
        console.log("holidays:", res.data.holidays);
    } catch(e) { }
}
run();
