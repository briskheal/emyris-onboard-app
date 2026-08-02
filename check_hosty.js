const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    conn.exec('free -m && echo "--" && df -h / && echo "--" && nproc && echo "--" && lscpu | grep "Model name"', (err, stream) => { 
        if (err) throw err; 
        stream.on('close', () => { conn.end(); })
              .on('data', (data) => { console.log(data.toString()); })
              .stderr.on('data', (data) => { console.error('STDERR: ' + data.toString()); }); 
    }); 
}).connect({ 
    host: '165.99.222.253', 
    port: 3052, 
    username: 'root', 
    password: 'DXkr0wPd*Bxd', 
    readyTimeout: 30000 
});
