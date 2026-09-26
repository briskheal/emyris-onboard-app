const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "router.delete('/dcs/doctors/:id', async (req, res) => { try { await XlDoctor.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });",
  "router.put('/dcs/doctors/:id', async (req, res) => { try { await XlDoctor.update(req.body, { where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });\nrouter.delete('/dcs/doctors/:id', async (req, res) => { try { await XlDoctor.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });"
);

c = c.replace(
  "router.delete('/dcs/chemists/:id', async (req, res) => { try { await XlChemist.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });",
  "router.put('/dcs/chemists/:id', async (req, res) => { try { await XlChemist.update(req.body, { where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });\nrouter.delete('/dcs/chemists/:id', async (req, res) => { try { await XlChemist.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });"
);

c = c.replace(
  "router.delete('/dcs/stockists/:id', async (req, res) => { try { await XlStockist.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });",
  "router.put('/dcs/stockists/:id', async (req, res) => { try { await XlStockist.update(req.body, { where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });\nrouter.delete('/dcs/stockists/:id', async (req, res) => { try { await XlStockist.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Added PUT routes for DCS');
