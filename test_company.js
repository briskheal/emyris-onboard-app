const http = require('http');

http.get('http://localhost:3000/api/company-data', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Divisions array length:', json.divisions ? json.divisions.length : 'undefined');
      if (json.divisions && json.divisions.length > 0) {
        console.log('First division:', json.divisions[0].name);
        console.log('Designations in first division:', JSON.stringify(json.divisions[0].designations));
      }
    } catch(e) {
      console.log('Error parsing response', e.message, data.substring(0, 100));
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
