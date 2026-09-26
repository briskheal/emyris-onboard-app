require('dotenv').config();
const { Company, Applicant, ExamResult } = require('../db');
const { sendEmail } = require('../utils/mailer');

async function testCron() {
    try {
        console.log('🧪 Starting Cron Logic Test...');
        const company = await Company.findOne();
        if (!company || !company.activeExamDate) {
            console.log('❌ No active exam scheduled. Skipping test.');
            process.exit(0);
        }

        const examDate = company.activeExamDate.substring(0, 10);
        const productName = company.activeExamProduct || 'General Assessment';
        console.log(`📌 Found active exam for Product: ${productName}, Date: ${examDate}`);

        const applicants = await Applicant.find({ status: { $nin: ['rejected'] } });
        console.log(`📌 Found ${applicants.length} active applicants.`);
        
        let reportRows = '';

        // Just test the first applicant to avoid spamming everyone during a test
        for (const app of applicants.slice(0, 2)) {
            console.log(`  🔍 Checking applicant: ${app.fullName} (${app.email})`);
            const existingResult = await ExamResult.findOne({ email: app.email, examDate: examDate });
            
            let attemptStatus = 'Not Attempted';
            if (!existingResult) {
                console.log(`  ➡️ Needs reminder. (Skipping actual email send for test)`);
                // Normally we would send email here
            } else {
                console.log(`  ➡️ Already attempted.`);
                attemptStatus = 'Attempted';
            }
            reportRows += `<tr><td>${app.fullName}</td><td>${attemptStatus}</td></tr>`;
        }

        console.log('📝 Generated Report Preview Rows:', reportRows);
        console.log('✅ Cron Logic Test Passed successfully without errors!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Cron Test Failed:', error);
        process.exit(1);
    }
}

testCron();
