const { Sequelize, DataTypes } = require('sequelize');

async function checkDb(dbPath) {
    console.log(`\n================ CHECKING ${dbPath} ================`);
    const seq = new Sequelize(`sqlite:${dbPath}`, { logging: false });
    try {
        const [tables] = await seq.query("SELECT name FROM sqlite_master WHERE type='table';");
        console.log("Tables:", tables.map(t => t.name).join(", "));

        for (let t of tables) {
            if (t.name.includes('applicant') || t.name.includes('exam') || t.name.includes('question')) {
                const [rows] = await seq.query(`SELECT * FROM ${t.name}`);
                console.log(`Table ${t.name}: ${rows.length} rows`);
                if (t.name.includes('applicant') || t.name.includes('exam')) {
                    rows.forEach(r => {
                        console.log(`  Row: email=${r.email || 'N/A'}, name=${r.fullName || r.name || 'N/A'}, status=${r.status || 'N/A'}`);
                        if (r.psychometricScores || r.mindsetReport || r.psychometricTestCompleted) {
                            console.log(`    Psychometric: completed=${r.psychometricTestCompleted}, scores=${(r.psychometricScores||'').substring(0,80)}, report=${(r.mindsetReport||'').substring(0,80)}`);
                        }
                    });
                }
            }
        }
    } catch (e) {
        console.error(`Error checking ${dbPath}:`, e.message);
    }
}

async function run() {
    await checkDb('./database.sqlite');
    await checkDb('./onboarding_fallback.sqlite');
    process.exit(0);
}
run();
