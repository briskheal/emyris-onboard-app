const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../onboarding_fallback.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`ALTER TABLE onboard_applicants ADD COLUMN pendingExams TEXT DEFAULT '[]';`, (err) => {
        if (err) {
            console.log('pendingExams column might already exist:', err.message);
        } else {
            console.log('✅ Added pendingExams column to applicants');
        }
    });
    db.close();
});
