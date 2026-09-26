const fs = require('fs');

let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', 'utf8');

const regexGet = /const tp = await XlTourProgram\.findOne\(\{ where: \{ employeeId: \{ \[Op\.in\]: idArray \}, month, year \} \}\);/;

const replacementGet = `
          const tps = await XlTourProgram.findAll({ where: { employeeId: { [Op.in]: idArray }, month, year } });
          let tp = null;
          if (tps.length > 0) {
              // Prefer Approved/Submitted over Draft, and longer entries over shorter ones
              tps.sort((a, b) => {
                  if (a.status === 'Approved' && b.status !== 'Approved') return -1;
                  if (b.status === 'Approved' && a.status !== 'Approved') return 1;
                  const aLen = a.entries ? a.entries.length : 0;
                  const bLen = b.entries ? b.entries.length : 0;
                  return bLen - aLen;
              });
              tp = tps[0];
          }
`;

if (regexGet.test(file)) {
    file = file.replace(regexGet, replacementGet);
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/xl.js', file);
    console.log("Patched GET /tour-program/my for duplicates");
} else {
    console.log("Failed to match GET /tour-program/my");
}
