const { XlDCR } = require('./models/xlModels');
async function run() {
    const dcrs = await XlDCR.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
    dcrs.forEach(d => console.log('DCR', d.employeeId, d.date));
}
run();
