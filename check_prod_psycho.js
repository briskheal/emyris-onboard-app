const https = require('https');

https.get('https://emyrishr.in/api/admin/applicants?reports=true', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const applicants = json.applicants || json.data || json;
            
            console.log(`Total applicants fetched: ${applicants.length}`);

            applicants.forEach(app => {
                if (app.psychometricTestCompleted || app.email === 'gohelhitesh010@gmail.com') {
                    let report = app.mindsetReport;
                    if (typeof report === 'string') {
                        try { report = JSON.parse(report); } catch(e){}
                    }
                    console.log(`- ${app.fullName || app.email} [TestCompleted: ${app.psychometricTestCompleted}]`);
                    if (report) {
                        console.log(`  Archetype: ${report.archetype}`);
                        console.log(`  Score: ${report.overallPercentile}%`);
                    } else {
                        console.log(`  No mindsetReport found in DB.`);
                    }
                }
            });
            
        } catch(e) {
            console.error('Parse error:', e.message);
        }
    });
}).on('error', e => console.error(e));
