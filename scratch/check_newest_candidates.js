const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('HostyCare SSH :: CONNECTED!');
    const cmd = `
docker exec 794db81d327e bash -c "cat << 'END_OF_JS' > /app/check_new.js
const { Sequelize } = require('sequelize');
const seq = new Sequelize(process.env.DATABASE_URL, { logging: false });
async function run() {
    try {
        await seq.authenticate();
        const [apps] = await seq.query('SELECT * FROM onboard_applicants;');
        console.log('=== ALL ' + apps.length + ' APPLICANTS ON HOSTYCARE POSTGRES ===');
        for (let i = 0; i < apps.length; i++) {
            const a = apps[i];
            const name = a.fullName || a['\"fullName\"'] || a.name || 'N/A';
            console.log('[' + (i+1) + '] ' + name + ' (' + a.email + ') - Status: ' + a.status);
            console.log('      RapidCompleted: ' + a.rapidTestCompleted + ' (Score: ' + a.rapidTestScore + ')');
            console.log('      PsyCompleted: ' + a.psychometricTestCompleted);
            const scores = typeof a.psychometricScores === 'string' ? a.psychometricScores : JSON.stringify(a.psychometricScores || {});
            const report = typeof a.mindsetReport === 'string' ? a.mindsetReport : JSON.stringify(a.mindsetReport || {});
            if (scores !== '{}' && scores !== 'null' && scores !== '' && scores !== 'undefined') {
                console.log('      PsyScores: ' + scores.substring(0, 300));
            }
            if (report !== '{}' && report !== 'null' && report !== '' && report !== 'undefined') {
                console.log('      MindsetReport: ' + report.substring(0, 300));
            }
        }
    } catch(e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}
run();
END_OF_JS
cd /app && node check_new.js && rm /app/check_new.js"
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
