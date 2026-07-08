const { ExamResult } = require('./db.js');
async function test() {
    try {
        const exams = await ExamResult.find({}).sort({ submittedAt: -1 });
        console.log("Success! Found", exams.length, "exams");
    } catch(e) {
        console.error("Failed:", e);
    }
    process.exit(0);
}
test();
