const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
db.serialize(() => {
    db.all("SELECT * FROM onboard_applicants WHERE email = 'briskheal@gmail.com'", (err, rows) => {
        console.log('APPLICANTS:', JSON.stringify(rows, null, 2));
        db.all("SELECT * FROM onboard_exam_results WHERE email = 'briskheal@gmail.com'", (err2, rows2) => {
            console.log('EXAM RESULTS:', JSON.stringify(rows2, null, 2));
            db.close();
        });
    });
});
