const fs = require('fs');
const path = require('path');
const file = path.join('routes', 'admin.js');
let code = fs.readFileSync(file, 'utf8');

// 1. Replace generateUID and upload endpoint
const uploadBlockStart = "async function generateUID(Model, prefix) {";
const uploadBlockEnd = "res.status(500).json({ success: false, message: e.message });\n  }\n});";

if (code.includes(uploadBlockStart) && code.includes(uploadBlockEnd)) {
    const preCode = code.substring(0, code.indexOf(uploadBlockStart));
    const postCode = code.substring(code.indexOf(uploadBlockEnd) + uploadBlockEnd.length);

    const newUploadBlock = 
async function getMaxUID(Model, prefix) {
  const records = await Model.findAll({ attributes: ['uid'] });
  let max = 0;
  for (let r of records) {
    if (r.uid && r.uid.startsWith(prefix)) {
      const num = parseInt(r.uid.substring(prefix.length)) || 0;
      if (num > max) max = num;
    }
  }
  return max;
}

async function getMaxDoctorCode() {
  const records = await require('../db').XlDoctor.findAll({ attributes: ['doctorCode'] });
  let max = 0;
  for (let r of records) {
    if (r.doctorCode && r.doctorCode.startsWith('DOC')) {
      const num = parseInt(r.doctorCode.substring(3)) || 0;
      if (num > max) max = num;
    }
  }
  return max;
}
  
router.get('/dcs/doctors', async (req, res) => { try { const docs = await require('../db').XlDoctor.findAll({ order: [['excelRowIndex', 'ASC'], ['createdAt', 'DESC']] }); res.json({ success: true, doctors: docs }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.post('/dcs/doctors', async (req, res) => { try { const data = req.body; if (!data.uid) data.uid = 'DOC' + ((await getMaxUID(require('../db').XlDoctor, 'DOC')) + 1); const doc = await require('../db').XlDoctor.create(data); res.json({ success: true, doctor: doc }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.delete('/dcs/doctors/:id', async (req, res) => { try { await require('../db').XlDoctor.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });

router.get('/dcs/chemists', async (req, res) => { try { const docs = await require('../db').XlChemist.findAll({ order: [['excelRowIndex', 'ASC'], ['createdAt', 'DESC']] }); res.json({ success: true, chemists: docs }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.post('/dcs/chemists', async (req, res) => { try { const data = req.body; if (!data.uid) data.uid = 'CHM' + ((await getMaxUID(require('../db').XlChemist, 'CHM')) + 1); const doc = await require('../db').XlChemist.create(data); res.json({ success: true, chemist: doc }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.delete('/dcs/chemists/:id', async (req, res) => { try { await require('../db').XlChemist.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });

router.get('/dcs/stockists', async (req, res) => { try { const docs = await require('../db').XlStockist.findAll({ order: [['excelRowIndex', 'ASC'], ['createdAt', 'DESC']] }); res.json({ success: true, stockists: docs }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.post('/dcs/stockists', async (req, res) => { try { const data = req.body; if (!data.uid) data.uid = 'STK' + ((await getMaxUID(require('../db').XlStockist, 'STK')) + 1); const doc = await require('../db').XlStockist.create(data); res.json({ success: true, stockist: doc }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.delete('/dcs/stockists/:id', async (req, res) => { try { await require('../db').XlStockist.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });

router.get('/dcs/controls', async (req, res) => { try { const controls = await require('../db').XlDoctorControl.findAll(); res.json({ success: true, controls }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.post('/dcs/controls', async (req, res) => { try { const c = await require('../db').XlDoctorControl.create(req.body); res.json({ success: true, control: c }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });
router.delete('/dcs/controls/:id', async (req, res) => { try { await require('../db').XlDoctorControl.destroy({ where: { _id: req.params.id } }); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } });

const upload = multer({ dest: 'uploads/' });

router.post('/dcs/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const type = req.body.type;
    const targetHq = req.body.hq;
    if (!type || !targetHq) throw new Error('Missing type or HQ');
    
    const wb = require('xlsx').readFile(req.file.path);
    const data = require('xlsx').utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    if (!data || data.length === 0) throw new Error('Empty or invalid excel file');

    let currentUidMax = 0;
    let currentDocCodeMax = 0;
    const { XlDoctor, XlChemist, XlStockist } = require('../db');

    if (type === 'Doctor') {
      currentUidMax = await getMaxUID(XlDoctor, 'DOC');
      currentDocCodeMax = await getMaxDoctorCode();
    } else if (type === 'Chemist') {
      currentUidMax = await getMaxUID(XlChemist, 'CHM');
    } else if (type === 'Stockist') {
      currentUidMax = await getMaxUID(XlStockist, 'STK');
    }

    const docs = [];
    let index = 0;
    for (let d of data) {
      // The user wants Headquarter mapped to targetHq, but let's safely handle empty fields
      let row = { headquarter: targetHq, status: 'Pending', excelRowIndex: index + 1 };
      
      // Auto-timestamp for Upload/Edit
      row.updateAt = new Date().toLocaleString();

      if (type === 'Doctor') {
        if (!d.UID || !d.uid) {
            currentUidMax++;
            row.uid = 'DOC' + currentUidMax;
        } else {
            row.uid = d.UID || d.uid;
        }

        row.name = d.Name || d.name || '';
        row.degree = d.Degree || d.degree || '';
        row.specialization = d.Specialization || d.specialization || '';
        row.hospital = d.Hospital || d.hospital || '';
        row.mobile = String(d.Mobile || d.mobile || '');
        row.clinicContact = String(d['Clinic Contact'] || d.clinicContact || '');
        
        if (!d['Doctor Code'] && !d.doctorCode) {
            currentDocCodeMax++;
            // Zero pad to 3 digits like DOC001
            row.doctorCode = 'DOC' + currentDocCodeMax.toString().padStart(3, '0');
        } else {
            row.doctorCode = String(d['Doctor Code'] || d.doctorCode || '');
        }

        row.category = d.Category || d.category || '';
        row.address = d.Address || d.address || '';
        row.workingArea = d['Working Area'] || d.workingArea || '';
        row.birthday = d.Birthday || d.birthday || '';
        row.anniversary = d.Anniversary || d.anniversary || '';
        row.email = d.Email || d.email || '';
        row.contact = String(d.Contact || d.contact || '');
        row.extraInformation = d['Extra Information'] || d.extraInformation || '';
      }
      if (type === 'Chemist') {
        if (!d.UID || !d.uid) {
            currentUidMax++;
            row.uid = 'CHM' + currentUidMax;
        } else {
            row.uid = d.UID || d.uid;
        }
        row.businessName = d['Business Name'] || d.businessName || d.Name || d.name || '';
        row.proprietorName = d['Proprietor Name'] || d.proprietorName || '';
        row.mobile = String(d.Mobile || d.mobile || '');
        row.email = d.Email || d.email || '';
        row.address = d.Address || d.address || '';
        row.workingArea = d['Working Area'] || d.workingArea || '';
        row.birthday = d.Birthday || d.birthday || '';
        row.certifications = d.Certifications || d.certifications || '';
        row.extraInformation = d['Extra Information'] || d.extraInformation || '';
      }
      if (type === 'Stockist') {
        if (!d.UID || !d.uid) {
            currentUidMax++;
            row.uid = 'STK' + currentUidMax;
        } else {
            row.uid = d.UID || d.uid;
        }
        row.businessName = d['Business Name'] || d.businessName || d.Name || d.name || '';
        row.name = d['Proprietor Name'] || d.name || '';
        row.mobile = String(d.Mobile || d.mobile || '');
        row.email = d.Email || d.email || '';
        row.gst = String(d.GST || d.gst || '');
        row.drugLicense = String(d['Drug License'] || d.drugLicense || '');
        row.address = d.Address || d.address || '';
        row.workingArea = d['Working Area'] || d.workingArea || '';
        row.certifications = d.Certifications || d.certifications || '';
        row.extraInformation = d['Extra Information'] || d.extraInformation || '';
      }
      
      docs.push(row);
      
      // Upsert logic
      if (type === 'Doctor') {
        const ex = await XlDoctor.findOne({ where: { uid: row.uid } });
        if (ex) await ex.update(row); else await XlDoctor.create(row);
      }
      if (type === 'Chemist') {
        const ex = await XlChemist.findOne({ where: { uid: row.uid } });
        if (ex) await ex.update(row); else await XlChemist.create(row);
      }
      if (type === 'Stockist') {
        const ex = await XlStockist.findOne({ where: { uid: row.uid } });
        if (ex) await ex.update(row); else await XlStockist.create(row);
      }
      
      index++;
    }

    res.json({ success: true, count: docs.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
;

    code = preCode + newUploadBlock + postCode;
    fs.writeFileSync(file, code);
    console.log('Upload logic rewritten successfully!');
} else {
    console.log('Upload block not found!');
}
