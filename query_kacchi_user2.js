const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/admin/users');
        const users = res.data.users;
        const kacchi = users.find(u => u.employeeId === 'KAC' || (u.firstName && u.firstName.toLowerCase().includes('kachhi')) || (u.lastName && u.lastName.toLowerCase().includes('kachhi')));
        console.log(kacchi);
    } catch(e) { }
}
run();
