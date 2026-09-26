const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://emyrishr.in/api/xl/settings/preferences');
        console.log(res.data);
    } catch(e) { }
}
run();
