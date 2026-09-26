const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/users'); // if it exists
        const kacchi = res.data.data.find(u => u.employeeId === 'KAC' || u.firstName === 'Mohammad');
        console.log(kacchi);
    } catch(e) { }
}
run();
