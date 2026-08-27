const http = require('https');
http.get('https://emyrishr.in/admin', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HTTP Status:', res.statusCode, 'Data preview:', data.substring(0, 300)));
}).on('error', err => console.log('Error:', err.message));
