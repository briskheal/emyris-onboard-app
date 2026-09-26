const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/debug/dcrs');
        const data = res.data.data;
        console.log("Total DCRs in DB:", data.length);
        const kacchiDCRs = data.filter(d => d.employeeId && d.employeeId.toLowerCase().includes('kac'));
        console.log("Kacchi DCRs:", kacchiDCRs.length);
        if(kacchiDCRs.length > 0) {
            console.log("Kacchi IDs:", [...new Set(kacchiDCRs.map(d => d.employeeId))]);
        }
    } catch(e) { console.error("Error", e.message); }
}
run();
