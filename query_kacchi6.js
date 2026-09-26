const axios = require('axios');
async function run() {
    const res = await axios.get('https://emyrishr.in/api/xl/attendance/monthly/all?month=09&year=2026');
    const data = res.data.data;
    console.log('Total Atts:', data.length);
    const kacchi = data.filter(d => d.employeeId === 'KAC' || d.employeeId === 'mohammad.kachhi@briskheal.com');
    console.log('Kacchi Atts:', kacchi.length, kacchi.map(d => d.date + ' ' + d.status));
}
run();
