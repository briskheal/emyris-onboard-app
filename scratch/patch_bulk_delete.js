const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "router.put('/dcs/controls/bulk-update', async (req, res) => { try { const { ids, updates } = req.body; await XlDoctorControl.update(updates, { where: { _id: ids } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });",
  "router.put('/dcs/controls/bulk-update', async (req, res) => { try { const { ids, updates } = req.body; await XlDoctorControl.update(updates, { where: { _id: ids } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });\nrouter.delete('/dcs/controls/bulk-hospitals', async (req, res) => { try { await XlDoctorControl.destroy({ where: { type: 'Hospital' }}); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Added bulk delete route');
