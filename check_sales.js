const { XlSecondarySales } = require('./db');
async function check() {
  try {
    const res = await XlSecondarySales.findAll({ raw: true });
    console.log("SECONDARY:", res.slice(0,5).map(r => ({ id: r._id, m: r.month, y: r.year, d: r.date })));
  } catch(e) { console.error(e); }
  
  const { XlPrimarySales } = require('./db');
  try {
    const res2 = await XlPrimarySales.findAll({ raw: true });
    console.log("PRIMARY:", res2.slice(0,5).map(r => ({ id: r._id, m: r.month, y: r.year, d: r.date })));
  } catch(e) { console.error(e); }
  
  process.exit(0);
}
check();
