const { Applicant, syncDatabase } = require('../db');
async function run() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    await syncDatabase();
    const apps = await Applicant.find({});
    console.log('Total applicants via MongooseAdapter:', apps.length);
    if (apps.length > 0) {
        apps.forEach((a, i) => {
            console.log(`${i+1}. ${a.fullName} (${a.email}) - Created: ${a.createdAt}`);
        });
    }
}
run().catch(console.error);
