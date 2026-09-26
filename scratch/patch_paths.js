const fs = require('fs');
const files = ['routes/admin.js', 'routes/applicant.js'];

files.forEach(f => {
    try {
        let txt = fs.readFileSync(f, 'utf8');
        txt = txt.replace(/__dirname,\s*'uploads'/g, "__dirname, '..', 'uploads'");
        txt = txt.replace(/__dirname,\s*'mongodb_backup_full\.json'/g, "__dirname, '..', 'mongodb_backup_full.json'");
        txt = txt.replace(/fs\.statfsSync\(__dirname\)/g, "fs.statfsSync(path.join(__dirname, '..'))");
        fs.writeFileSync(f, txt);
        console.log('Fixed path bugs in', f);
    } catch (e) {
        console.error('Error processing', f, e);
    }
});
