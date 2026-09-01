const { Sequelize } = require('sequelize');
const initModels = require('../models/pgModels');
const { MongooseAdapter } = require('../models/adapter');

async function checkFile(dbPath, label) {
    console.log(`\n=================== CHECKING: ${label} (${dbPath}) ===================`);
    try {
        const sequelize = new Sequelize(`sqlite:${dbPath}`, { logging: false });
        const models = initModels(sequelize);
        const Applicant = new MongooseAdapter(models.OnboardApplicant);
        const Company = new MongooseAdapter(models.OnboardCompany);

        await sequelize.sync();
        const comp = await Company.findOne();
        console.log('Company:', comp ? { name: comp.name, activeExamProduct: comp.activeExamProduct, activeExamDate: comp.activeExamDate } : 'None');

        const apps = await Applicant.find({});
        console.log(`Total Applicants in ${label}: ${apps.length}`);
        apps.forEach((app, idx) => {
            let pending = [];
            try {
                pending = typeof app.pendingExams === 'string' ? JSON.parse(app.pendingExams) : (app.pendingExams || []);
            } catch(e) { pending = []; }
            console.log(`[#${idx + 1}] ID: ${app._id} | Name: ${app.fullName || app.name} | Email: ${app.email} | Status: ${app.status} | CanLogin: ${app.canLogin}`);
            console.log(`     Pending Exams (${pending.length}):`, JSON.stringify(pending));
        });
    } catch (e) {
        console.error(`Error with ${label}:`, e.message);
    }
}

async function run() {
    await checkFile('./onboarding_fallback.sqlite', 'onboarding_fallback.sqlite');
    await checkFile('./database.sqlite', 'database.sqlite');
    process.exit(0);
}
run();
