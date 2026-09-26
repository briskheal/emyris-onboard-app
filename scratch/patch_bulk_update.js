const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "router.post('/dcs/controls/bulk', async (req, res) => { try { const inserted = await XlDoctorControl.bulkCreate(req.body); res.json({ success: true, count: inserted.length }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });",
  "router.post('/dcs/controls/bulk', async (req, res) => { try { const inserted = await XlDoctorControl.bulkCreate(req.body); res.json({ success: true, count: inserted.length }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });\nrouter.put('/dcs/controls/bulk-update', async (req, res) => { try { const { ids, updates } = req.body; await XlDoctorControl.update(updates, { where: { _id: ids } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Added bulk-update route');
