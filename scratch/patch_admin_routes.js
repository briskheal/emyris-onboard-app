const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "router.delete('/dcs/controls/:id', async (req, res) => { try { await XlDoctorControl.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });",
  "router.put('/dcs/controls/:id', async (req, res) => { try { await XlDoctorControl.update(req.body, { where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });\nrouter.delete('/dcs/controls/:id', async (req, res) => { try { await XlDoctorControl.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Added PUT route for controls');
