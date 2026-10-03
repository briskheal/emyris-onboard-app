const fs = require('fs');

let c = fs.readFileSync('routes/admin.js', 'utf8');

c = c.replace(
  "router.delete('/dcs/controls/bulk-hospitals', async (req, res) => { try { await XlDoctorControl.destroy({ where: { type: 'Hospital' }}); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });",
  "router.delete('/dcs/controls/bulk-hospitals', async (req, res) => { try { await XlDoctorControl.destroy({ where: { type: 'Hospital' }}); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });\nrouter.get('/force-reseed-hospitals', async (req, res) => {\n  try {\n    await XlDoctorControl.destroy({ where: { type: 'Hospital' } });\n    const XLSX = require('xlsx');\n    const wb = XLSX.readFile('REPORTING MODULE/Hospitals.xlsx');\n    const ws = wb.Sheets[wb.SheetNames[0]];\n    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });\n    const rows = data.slice(1).filter(r => r && r.length > 0 && r[1] && typeof r[1] === 'string' && !r[1].startsWith('Date of File'));\n    const records = [];\n    for (let r of rows) {\n      let name = r[1].trim();\n      let hq = null;\n      if (name.includes(',')) {\n        const parts = name.split(',');\n        name = parts[0].trim();\n        hq = parts[1].trim();\n      }\n      records.push({ type: 'Hospital', name, hq, area: null, isActive: true });\n    }\n    await XlDoctorControl.bulkCreate(records);\n    res.send(`<h1>Success! Wiped and reseeded ${records.length} hospitals.</h1><p>You can now close this tab and refresh the Settings page.</p>`);\n  } catch(e) {\n    res.send(`<h1>Error</h1><p>${e.message}</p>`);\n  }\n});"
);

fs.writeFileSync('routes/admin.js', c);
console.log('Added force-reseed-hospitals route');
