const fs = require('fs');
const path = require('path');
const file = path.join('routes', 'admin.js');
let code = fs.readFileSync(file, 'utf8');

const newFunctions = \
async function getMaxUID(Model, prefix) {
  const records = await Model.findAll({ attributes: ['uid'] });
  let max = 0;
  for (let r of records) {
    if (r.uid && r.uid.startsWith(prefix)) {
      const num = parseInt(r.uid.substring(prefix.length)) || 0;
      if (num > max) max = num;
    }
  }
  return max;
}

async function getMaxDoctorCode(Model) {
  const records = await Model.findAll({ attributes: ['doctorCode'] });
  let max = 0;
  for (let r of records) {
    if (r.doctorCode && r.doctorCode.startsWith('DOC')) {
      const num = parseInt(r.doctorCode.substring(3)) || 0;
      if (num > max) max = num;
    }
  }
  return max;
}
\;

if (!code.includes('async function getMaxUID')) {
    code = code.replace("async function generateUID", newFunctions + "\n\nasync function generateUID");
    fs.writeFileSync(file, code);
    console.log('Functions injected!');
}
