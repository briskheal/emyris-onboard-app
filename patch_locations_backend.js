const fs = require('fs');
let src = fs.readFileSync('routes/admin.js', 'utf8');

// Replace COUNT with getMaxUID for states
src = src.replace(
    /const count = await XlState\.count\(\);\s*const uid = 'STE' \+ \(count \+ 1\);/,
    "const max = await getMaxUID(XlState, 'STE');\n        const uid = 'STE' + (max + 1);"
);

// Replace COUNT with getMaxUID for HQs
src = src.replace(
    /const count = await XlHQ\.count\(\);\s*const uid = 'HQS' \+ \(count \+ 1\);/,
    "const max = await getMaxUID(XlHQ, 'HQS');\n        const uid = 'HQS' + (max + 1);"
);

// Replace COUNT with getMaxUID for cities
src = src.replace(
    /const count = await XlCity\.count\(\);\s*const uid = 'CTY' \+ \(count \+ 1\);/,
    "const max = await getMaxUID(XlCity, 'CTY');\n        const uid = 'CTY' + (max + 1);"
);

// Replace COUNT with getMaxUID for routes
src = src.replace(
    /const count = await XlRoute\.count\(\);\s*const uid = 'RTE' \+ \(count \+ 1\);/,
    "const max = await getMaxUID(XlRoute, 'RTE');\n        const uid = 'RTE' + (max + 1);"
);

// Now let's inject the /locations/upload route just before the /dcs/upload route or at the end of the location block.
const locationsBlockEnd = "router.get('/locations/divisions', async (req, res) => {";
const uploadRouteCode = `
router.post('/locations/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const type = req.body.type;
    if (!type) throw new Error('Missing location type');
    
    const wb = require('xlsx').readFile(req.file.path);
    const data = require('xlsx').utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    if (!data || data.length === 0) throw new Error('Empty or invalid excel file');

    let currentUidMax = 0;
    const { XlState, XlHQ, XlCity, XlRoute } = require('../db');

    if (type === 'State') currentUidMax = await getMaxUID(XlState, 'STE');
    if (type === 'Headquarter') currentUidMax = await getMaxUID(XlHQ, 'HQS');
    if (type === 'CityOrArea') currentUidMax = await getMaxUID(XlCity, 'CTY');
    if (type === 'Route') currentUidMax = await getMaxUID(XlRoute, 'RTE');

    const docs = [];
    
    for (let d of data) {
      if (type === 'State') {
        const stateName = String(d['State Name'] || d.stateName || d.State || d.state || '').trim();
        if(!stateName) continue;
        let uid = d.UID || d.uid;
        if (!uid) { currentUidMax++; uid = 'STE' + currentUidMax; }
        
        let row = { stateName, uid };
        const ex = await XlState.findOne({ where: { uid } });
        if (ex) await ex.update(row); else await XlState.create(row);
        docs.push(row);
      }
      
      if (type === 'Headquarter') {
        const hqName = String(d['HQ Name'] || d.hqName || d.Headquarter || d.HQ || '').trim();
        const state = String(d.State || d.state || '').trim();
        if(!hqName) continue;
        let uid = d.UID || d.uid;
        if (!uid) { currentUidMax++; uid = 'HQS' + currentUidMax; }
        
        let row = { hqName, state, uid };
        const ex = await XlHQ.findOne({ where: { uid } });
        if (ex) await ex.update(row); else await XlHQ.create(row);
        docs.push(row);
      }
      
      if (type === 'CityOrArea') {
        const cityName = String(d['City Name'] || d.cityName || d.City || d.city || '').trim();
        const hq = String(d.HQ || d.hq || d.Headquarter || '').trim();
        const state = String(d.State || d.state || '').trim();
        const areaType = String(d['Area Type'] || d.areaType || '').trim();
        if(!cityName) continue;
        let uid = d.UID || d.uid;
        if (!uid) { currentUidMax++; uid = 'CTY' + currentUidMax; }
        
        let row = { cityName, hq, state, areaType, uid };
        const ex = await XlCity.findOne({ where: { uid } });
        if (ex) await ex.update(row); else await XlCity.create(row);
        docs.push(row);
      }
      
      if (type === 'Route') {
        const fromCity = String(d['From City'] || d.fromCity || d.From || '').trim();
        const toCity = String(d['To City'] || d.toCity || d.To || '').trim();
        const hq = String(d.HQ || d.hq || d.Headquarter || '').trim();
        const state = String(d.State || d.state || '').trim();
        const distance = parseInt(d.Distance || d.distance || 0);
        const areaType = String(d['Area Type'] || d.areaType || '').trim();
        if(!fromCity || !toCity) continue;
        let uid = d.UID || d.uid;
        if (!uid) { currentUidMax++; uid = 'RTE' + currentUidMax; }
        
        let row = { fromCity, toCity, hq, state, distance, areaType, uid };
        const ex = await XlRoute.findOne({ where: { uid } });
        if (ex) await ex.update(row); else await XlRoute.create(row);
        docs.push(row);
      }
    }

    res.json({ success: true, count: docs.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

`;

if(src.includes('router.post(\'/locations/upload\'')) {
    console.log('Upload route already exists!');
} else {
    src = src.replace(locationsBlockEnd, uploadRouteCode + locationsBlockEnd);
    fs.writeFileSync('routes/admin.js', src);
    console.log('Backend patched with location UIDs and upload route.');
}
