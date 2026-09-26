const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/dcr/monthly?email=mohammad.kachhi@briskheal.com&month=09&year=2026');
        console.log("Kachhi DCRs in Sep:", res.data.data.length);
    } catch(e) { }
}
run();
