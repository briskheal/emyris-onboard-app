const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('HostyCare SSH :: CONNECTED!');
    const cmd = `
        echo "=== Docker Containers ==="
        docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Image}}"
        echo "\n=== Coolify / Git deployment path or ENV of Emyris Onboard container ==="
        CONTAINER_ID=$(docker ps | grep -i "onboard" | awk '{print $1}')
        if [ -z "$CONTAINER_ID" ]; then
            CONTAINER_ID=$(docker ps | grep "node server.js" | awk '{print $1}')
        fi
        if [ -n "$CONTAINER_ID" ]; then
            echo "Container ID: $CONTAINER_ID"
            docker exec $CONTAINER_ID pwd
            docker exec $CONTAINER_ID ls -la
            docker exec $CONTAINER_ID env | grep -E "DATABASE_URL|POSTGRES|PORT|NODE_ENV"
        else
            echo "Searching all node containers for emyrishr..."
            for c in $(docker ps -q); do
                echo "Container $c:"
                docker exec $c ls app 2>/dev/null || docker exec $c ls 2>/dev/null
            done
        fi
    `;
    conn.exec(cmd, (err, stream) => {
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
