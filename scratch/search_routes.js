const fs = require('fs');
['routes/admin.js', 'server.js', 'routes/applicant.js'].forEach(file => {
    if (!fs.existsSync(file)) return;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
        if (line.includes('pending-exams') || line.includes('grade-exam') || line.includes('descriptive') || line.includes('manualScore')) {
            console.log(`${file}:${i+1}: ${line.trim()}`);
        }
    });
});
