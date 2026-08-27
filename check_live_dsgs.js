const axios = require('axios');
axios.get('https://emyrishr.in/api/admin/locations/designations').then(res => {
  console.log('LIVE XLA DESIGNATIONS:');
  console.dir(res.data.designations, {depth: null});
}).catch(console.error);
