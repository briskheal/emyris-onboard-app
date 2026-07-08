const fs = require('fs');

let adminScript = fs.readFileSync('admin-script.js', 'utf8');
const regexAdmin = /async function saveExamSchedule\(\)\s*\{\s*const el = document\.getElementById\('activeExamDateInput'\);\s*if \(\!el\) return;\s*const dateStr = el\.value;\s*try\s*\{\s*const res = await fetch\('\/api\/admin\/schedule-exam',\s*\{\s*method: 'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{ date: dateStr \}\)\s*\}\);/;

const newSaveExam = `async function saveExamSchedule() {
    const el = document.getElementById('activeExamDateInput');
    const prodEl = document.getElementById('activeExamProductInput');
    if (!el) return;
    const dateStr = el.value;
    const prodStr = prodEl ? prodEl.value : '';
    try {
        const res = await fetch('/api/admin/schedule-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, product: prodStr })
        });`;

if (regexAdmin.test(adminScript)) {
    adminScript = adminScript.replace(regexAdmin, newSaveExam);
    fs.writeFileSync('admin-script.js', adminScript);
    console.log('Patched admin-script.js');
} else {
    console.log('Failed to match admin-script.js');
}

let serverJs = fs.readFileSync('server.js', 'utf8');
const regexServer = /app\.post\('\/api\/admin\/schedule-exam',\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{\s*const\s*\{\s*date\s*\}\s*=\s*req\.body;\s*const\s*company\s*=\s*await\s*Company\.findOne\(\);\s*if\s*\(company\)\s*\{\s*await\s*Company\.updateOne\(\{\s*_id:\s*company\._id\s*\},\s*\{\s*\$set:\s*\{\s*activeExamDate:\s*date\s*\}\s*\}\);/;

const newServerRoute = `app.post('/api/admin/schedule-exam', async (req, res) => {
    try {
        const { date, product } = req.body;
        const company = await Company.findOne();
        if (company) {
            await Company.updateOne({ _id: company._id }, { $set: { activeExamDate: date, activeExamProduct: product || '' } });`;

if (regexServer.test(serverJs)) {
    serverJs = serverJs.replace(regexServer, newServerRoute);
    fs.writeFileSync('server.js', serverJs);
    console.log('Patched server.js');
} else {
    console.log('Failed to match server.js');
}
