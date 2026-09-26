const axios = require('axios');
async function run() {
  try {
    const payload = {
      settings: {
        workingDays: {
          Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false
        }
      }
    };
    const res = await axios.post('https://emyrishr.in/api/xl/settings/preferences', payload);
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.log(e.message);
  }
}
run();
