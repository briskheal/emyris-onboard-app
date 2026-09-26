const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/dcr/monthly?email=mohammad.kachhi@briskheal.com&month=08&year=2026');
        console.log("Kachhi DCRs in Aug:", res.data.data.length);
        const res2 = await axios.get('https://emyrishr.in/api/xl/dcr/monthly?email=KAC&month=09&year=2026');
        console.log("Kachhi DCRs in Sep (KAC):", res2.data.data.length);
    } catch(e) { }
}
run();
