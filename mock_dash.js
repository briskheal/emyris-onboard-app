const express = require('express');
const app = express();
const xl = require('./routes/xl.js'); // Wait, let's use the live db
app.use('/api/xl', xl);

app.listen(3015, async () => {
    try {
        const res = await fetch('http://localhost:3015/api/xl/admin/dashboard-stats?month=Sep&year=2026');
        const text = await res.text();
        console.log("RESPONSE:", text.substring(0, 500));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
});
