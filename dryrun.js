const xlsx = require('xlsx');
const path = require('path');
const { XlDoctor, sequelize } = require('./db');

async function test() {
    await sequelize.authenticate();
    const filePath = path.join('REPORTING MODULE', 'Doctor List-Alfez.xlsx');
    const data = xlsx.utils.sheet_to_json(xlsx.readFile(filePath).Sheets[xlsx.readFile(filePath).SheetNames[0]]);
    
    let success = 0;
    let failed = 0;
    let failures = [];

    for (let i = 0; i < data.length; i++) {
        let d = data[i];
        let row = { headquarter: d.Headquarter || 'test', status: 'Pending', uid: d.UID || d.uid };
        row.name = d.Name || d.name || '';
        row.degree = d.Degree || d.degree || '';
        row.specialization = d.Specialization || d.specialization || '';
        row.hospital = d.Hospital || d.hospital || '';
        row.mobile = String(d.Mobile || d.mobile || '');
        row.clinicContact = String(d['Clinic Contact'] || d.clinicContact || '');
        row.doctorCode = String(d['Doctor Code'] || d.doctorCode || '');
        row.category = d.Category || d.category || '';
        row.address = d.Address || d.address || '';
        row.workingArea = d['Working Area'] || d.workingArea || '';
        row.birthday = d.Birthday || d.birthday || '';
        row.anniversary = d.Anniversary || d.anniversary || '';
        row.email = d.Email || d.email || '';
        row.contact = String(d.Contact || d.contact || '');
        row.extraInformation = d['Extra Information'] || d.extraInformation || '';
        row.updateAt = d['Update At'] || d.updateAt || '';

        try {
            await XlDoctor.build(row).validate();
            success++;
        } catch (e) {
            failed++;
            failures.push({ row: i + 1, error: e.message, data: row });
        }
    }
    
    console.log('Success:', success);
    console.log('Failed:', failed);
    if (failed > 0) {
        console.log('Failures:', JSON.stringify(failures, null, 2));
    }
    process.exit(0);
}
test();
