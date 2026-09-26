const { ExamResult } = require('../db');

async function main() {
    const docs = await ExamResult.find();
    console.log(JSON.stringify(docs[0], null, 2));
    process.exit(0);
    process.exit(0);
}
main().catch(console.error);
