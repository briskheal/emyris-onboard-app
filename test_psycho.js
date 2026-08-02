const http = require('http');

const data = JSON.stringify({
    email: 'dummy@test.com',
    answers: {} // Submit empty answers
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/applicant/submit-psychometric',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let responseBody = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => {
        console.log(`BODY: ${responseBody}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
