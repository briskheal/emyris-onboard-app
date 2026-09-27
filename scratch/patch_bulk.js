const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "router.post('/dcs/controls', async (req, res) => { try { const c = await XlDoctorControl.create(req.body); res.json({ success: true, control: c }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });",
  "router.post('/dcs/controls', async (req, res) => { try { const c = await XlDoctorControl.create(req.body); res.json({ success: true, control: c }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });\nrouter.post('/dcs/controls/bulk', async (req, res) => { try { const inserted = await XlDoctorControl.bulkCreate(req.body); res.json({ success: true, count: inserted.length }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Added /dcs/controls/bulk route');
