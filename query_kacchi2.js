const { XlAttendance, XlDCR, XlUser } = require('./db.js');
async function run() {
  const users = await XlUser.findAll();
  const kacchi = users.find(u => u.lastName && u.lastName.toLowerCase().includes('kachhi'));
  if (kacchi) {
      console.log('Kacchi email:', kacchi.email);
      const email = kacchi.email;
      const dcr = await XlDCR.findAll({where: {employeeId: email}});
      console.log('DCR count:', dcr.length);
      if (dcr.length > 0) {
          console.log('Sample DCR dates:', dcr.map(d => d.date).slice(0, 5));
      } else {
          // Maybe he used a different email? Or maybe his name is stored differently in DCR?
          const dcr2 = await XlDCR.findAll({where: {employeeName: kacchi.firstName + ' ' + kacchi.lastName}});
          console.log('DCR count by name:', dcr2.length);
      }
      const atts = await XlAttendance.findAll({where: {employeeId: email}});
      console.log('Attendance count:', atts.length);
  } else {
      console.log('Kacchi not found');
  }
}
run();
