const { Company, XlDesignation } = require('./db');

async function test() {
  const comp = await Company.findOne();
  console.log('--- ADMIN PORTAL DESIGNATIONS (Company.designations) ---');
  console.log(comp.designations);

  const xlDsgs = await XlDesignation.findAll();
  console.log('\n--- XLA PORTAL DESIGNATIONS (XlDesignation) ---');
  console.log(xlDsgs.map(d => d.designationName));
}
test();
