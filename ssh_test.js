const { Client } = require('ssh2');

const ports = [22, 2022, 2222, 222, 2023, 2083, 4083, 8080];
let current = 0;

function tryNext() {
  if (current >= ports.length) {
    console.log('All ports failed.');
    return;
  }
  const port = ports[current++];
  console.log('Trying port: ' + port);
  const conn = new Client();
  conn.on('ready', () => {
    console.log('Client :: ready on port ' + port);
    conn.exec('pm2 status', (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
        conn.end();
      }).on('data', (data) => {
        console.log('STDOUT: ' + data);
      }).stderr.on('data', (data) => {
        console.log('STDERR: ' + data);
      });
    });
  }).on('error', (err) => {
    console.log('Port ' + port + ' failed: ' + err.message);
    tryNext();
  }).connect({
    host: '165.99.222.253',
    port: port,
    username: 'root',
    password: 'DXkr0wPd*Bxd',
    readyTimeout: 3000
  });
}

tryNext();
