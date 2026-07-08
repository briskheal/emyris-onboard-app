const { CompanyProfile } = require('./db.js');
async function run() {
    try {
        const c = await CompanyProfile.findOne();
        console.log("requiredDocs:", c.requiredDocs, typeof c.requiredDocs, Array.isArray(c.requiredDocs));
    } catch(e) { console.error(e); }
    process.exit(0);
}
run();
