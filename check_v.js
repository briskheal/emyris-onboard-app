const { XlHQ, Op } = require('./db');
async function check() {
  try {
    const res = await XlHQ.findAll({ raw: true });
    const filtered = res.filter(h => h.hqName && h.hqName.toLowerCase().includes('vadodara'));
    console.log(filtered.map(h => ({ uid: h.uid, hqName: h.hqName, state: h.state })));
  } catch(e) { console.error(e); }
  process.exit(0);
}
check();
