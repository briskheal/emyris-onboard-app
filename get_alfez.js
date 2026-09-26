require('dotenv').config();
const { Applicant } = require('./db.js');
async function run() {
  const apps = await Applicant.find();
  const app = apps.find(a => a.empCode === 'EMYFE118' || (a.fullName && a.fullName.toLowerCase().includes('alfez')));
  console.log("Found:", app ? app.fullName : "None");
  if (app) console.log(JSON.stringify(app.salaryBreakup, null, 2));
  process.exit(0);
}
run();
