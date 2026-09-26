const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('HostyCare SSH :: CONNECTED!');
    const cmd = `
        echo "=== PM2 status & running apps ==="
        pm2 status || ps aux | grep node
        echo "\n=== Finding Emyris Onboard App directory on VPS ==="
        find /var/www /root /home -name "server.js" -o -name "db.js" 2>/dev/null | grep -i "onboard" || find / -name "admin-script.js" 2>/dev/null
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
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
