const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/attendance/monthly/all?month=09&year=2026&rand=' + Date.now());
        const data = res.data.data;
        console.log(data.map(d => d.employeeId + ' ' + d.date).join('\n'));
    } catch(e) { }
}
run();
