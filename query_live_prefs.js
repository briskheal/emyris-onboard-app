const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('https://emyrishr.in/api/xl/settings/preferences');
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.log(e.message);
  }
}
run();
