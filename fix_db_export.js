const fs = require('fs');
let c = fs.readFileSync('db.js', 'utf8');

if (!c.includes('generateId, XlAnnouncement')) {
    c = c.replace('generateId \n};', 'generateId, \n    XlAnnouncement \n};');
    c = c.replace('generateId\n};', 'generateId, \n    XlAnnouncement \n};');
    c = c.replace('generateId \r\n};', 'generateId, \n    XlAnnouncement \n};');
    c = c.replace('generateId\r\n};', 'generateId, \n    XlAnnouncement \n};');
    fs.writeFileSync('db.js', c);
    console.log('Fixed export in db.js');
}
