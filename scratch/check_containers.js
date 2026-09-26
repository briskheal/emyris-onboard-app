const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('HostyCare SSH :: CONNECTED!');
    conn.exec('docker ps', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data.toString());
        });
    });
}).on('error', err => {
    console.error('SSH Error:', err);
}).connect({
    host: '165.99.222.253',
    port: 3052,
    username: 'root',
    password: 'DXkr0wPd*Bxd',
    readyTimeout: 30000
});
