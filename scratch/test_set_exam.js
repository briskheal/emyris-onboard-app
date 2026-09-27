const { Company } = require('../db');
async function go() {
    const c = await Company.findOne();
    if (c) {
        await Company.updateOne({_id: c._id}, { $set: { activeExamDate: new Date().toISOString(), activeExamProduct: 'Test Product' } });
        console.log('Exam scheduled.');
    }
}
go();
