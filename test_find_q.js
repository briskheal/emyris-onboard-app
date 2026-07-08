const { Question } = require('./db.js');
async function test() {
    try {
        const questions = await Question.find({});
        console.log("Success! Found", questions.length, "questions");
    } catch(e) {
        console.error("Failed:", e);
    }
    process.exit(0);
}
test();
