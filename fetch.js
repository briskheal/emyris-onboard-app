const http = require('https');
http.get('https://emyrishr.in/xla/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
