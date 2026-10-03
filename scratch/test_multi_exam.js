const { Applicant } = require('../db');
const cronUtils = require('../utils/cron');

async function testMulti() {
    try {
        console.log('Testing Multi-Exam Queue...');
        
        const app = await Applicant.findOne({ email: 'test_dot@example.com' });
        if (!app) return;

        const newExam1 = { id: 'exam_1', examDate: '2026-07-11', targetProduct: 'Test Product 1' };
        const newExam2 = { id: 'exam_2', examDate: '2026-07-12', targetProduct: 'Test Product 2' };

        app.pendingExams = [newExam1, newExam2];
        await Applicant.updateOne({ _id: app._id }, { $set: { pendingExams: JSON.stringify(app.pendingExams) } });
        console.log(`✅ Queued 2 exams for ${app.email}.`);

        const updatedApp = await Applicant.findOne({ email: 'test_dot@example.com' });
        let pending = [];
        try { pending = typeof updatedApp.pendingExams === 'string' ? JSON.parse(updatedApp.pendingExams) : updatedApp.pendingExams; } catch(e){}
        
        console.log(`🔍 Parsed pendingExams length: ${pending.length}`);
        if (pending.length === 2) {
            console.log('✅ Multi-Exam Queue parsing working flawlessly!');
        } else {
            console.log('❌ Failed to parse pendingExams');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testMulti();
