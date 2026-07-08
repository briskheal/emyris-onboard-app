const fs = require('fs');

let adminHtml = fs.readFileSync('admin.html', 'utf8');
if (adminHtml.includes('<script src="admin-script.js"></script>')) {
    adminHtml = adminHtml.replace(
        '<script src="admin-script.js"></script>',
        '<script src="admin-script.js?v=' + Date.now() + '"></script>'
    );
    fs.writeFileSync('admin.html', adminHtml);
    console.log('Cache busted admin.html');
}

let indexHtml = fs.readFileSync('index.html', 'utf8');
if (indexHtml.includes('<script src="script.js?v=2"></script>')) {
    indexHtml = indexHtml.replace(
        '<script src="script.js?v=2"></script>',
        '<script src="script.js?v=' + Date.now() + '"></script>'
    );
    fs.writeFileSync('index.html', indexHtml);
    console.log('Cache busted index.html');
}
