const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('HostyCare SSH :: CONNECTED!');
    const cmd = `
CONTAINER_ID=$(docker ps | grep "inw9vguow8ifcoxsg9j0pfj6" | awk '{print $1}')
if [ -z "$CONTAINER_ID" ]; then
    CONTAINER_ID=$(docker ps | grep -i "onboard" | awk '{print $1}')
fi
echo "Using container: $CONTAINER_ID"

docker exec $CONTAINER_ID bash -c "cat << 'END_OF_JS' > /app/check_brisk.js
const { Sequelize } = require('sequelize');
const seq = new Sequelize(process.env.DATABASE_URL, { logging: false });
async function run() {
    try {
        await seq.authenticate();
        const [apps] = await seq.query('SELECT * FROM onboard_applicants WHERE email ILIKE :q;', { replacements: { q: '%briskheal%' } });
        console.log('=== BRISKHEAL ON HOSTYCARE POSTGRES (onboard_applicants) ===');
        if (apps.length === 0) console.log('No briskheal applicant found');
        for (let idx = 0; idx < apps.length; idx++) {
            const a = apps[idx];
            console.log('[' + (idx+1) + '] ' + a.fullName + ' (' + a.email + ') - Status: ' + a.status);
            console.log('      RapidCompleted: ' + a.rapidTestCompleted + ' (Score: ' + a.rapidTestScore + ')');
            console.log('      PsyCompleted: ' + a.psychometricTestCompleted);
            console.log('      PsyScores (' + typeof a.psychometricScores + '): ' + JSON.stringify(a.psychometricScores || {}));
            console.log('      MindsetReport (' + typeof a.mindsetReport + '): ' + JSON.stringify(a.mindsetReport || {}));
        }
        const [exams] = await seq.query('SELECT * FROM onboard_exam_results WHERE email ILIKE :q;', { replacements: { q: '%briskheal%' } });
        console.log('=== BRISKHEAL EXAM RECORDS ON HOSTYCARE POSTGRES (onboard_exam_results) ===');
        console.log(JSON.stringify(exams, null, 2));
    } catch(e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}
run();
END_OF_JS
cd /app && node check_brisk.js && rm /app/check_brisk.js"
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
