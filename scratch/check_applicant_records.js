const { Applicant, Company, ExamResult, syncDatabase } = require('../db');

async function inspectRecords() {
    try {
        await syncDatabase();
        const company = await Company.findOne();
        console.log('\n--- ACTIVE COMPANY EXAM CONFIG ---');
        console.log(JSON.stringify({
            name: company?.name,
            activeExamProduct: company?.activeExamProduct,
            activeExamDate: company?.activeExamDate,
            examMcqTime: company?.examMcqTime,
            examDescriptiveTime: company?.examDescriptiveTime,
            rapidTestTime: company?.rapidTestTime
        }, null, 2));

        const applicants = await Applicant.find();
        console.log(`\n--- TOTAL APPLICANTS IN DATABASE: ${applicants.length} ---`);
        applicants.forEach((app, idx) => {
            let pending = [];
            try {
                pending = typeof app.pendingExams === 'string' ? JSON.parse(app.pendingExams) : (app.pendingExams || []);
            } catch(e) { pending = []; }

            console.log(`\n[#${idx + 1}] Name: ${app.name} | Email: ${app.email} | Status: ${app.status} | CanLogin: ${app.canLogin}`);
            console.log(`     Pending Exams Count: ${pending.length}`);
            if (pending.length > 0) {
                console.log(`     Pending Exams Details:`, JSON.stringify(pending, null, 2));
            }
        });
        process.exit(0);
    } catch(err) {
        console.error("Error checking database:", err);
        process.exit(1);
    }
}

inspectRecords();
