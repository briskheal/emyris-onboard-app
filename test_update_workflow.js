const { Applicant } = require('./db.js');

async function test() {
  const app = await Applicant.findOne({ email: 'sasmita45@yopmail.com' });
  console.log('Before:', app.salaryBreakup);
  
  await Applicant.findOneAndUpdate({ email: 'sasmita45@yopmail.com' }, {
    $set: {
      salaryBreakup: {
        basic: 1000,
        hra: 500,
        lta: 100,
        conveyance: 200,
        medical: 300,
        special: 400,
        edu: 500,
        fixed: 600
      }
    }
  });

  const appAfter = await Applicant.findOne({ email: 'sasmita45@yopmail.com' });
  console.log('After:', appAfter.salaryBreakup);
}

test().catch(console.error).then(() => process.exit(0));
