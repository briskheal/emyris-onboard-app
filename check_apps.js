const { Applicant } = require('./db.js');
async function run() {
    try {
        const apps = await Applicant.find({});
        console.log("Total applicants:", apps.length);
        if (apps.length > 0) {
            console.log(apps.map(a => ({ email: a.email, fullName: a.fullName, offerAccepted: a.offerAccepted, actualJoiningDate: a.actualJoiningDate })));
        }
    } catch(e) { console.error(e); }
    process.exit(0);
}
run();
