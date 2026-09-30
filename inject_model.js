const fs = require('fs');
let c = fs.readFileSync('models/xlModels.js', 'utf8');

if (!c.includes('XlAnnouncement')) {
    c = c.replace(
        'const XlVacancyLog =', 
        `const XlAnnouncement = sequelize.define('xl_announcement', { 
            _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId }, 
            message: { type: DataTypes.TEXT, allowNull: false }, 
            active: { type: DataTypes.BOOLEAN, defaultValue: true } 
        });\n    const XlVacancyLog =`
    );

    c = c.replace(
        'XlNotification,', 
        'XlNotification,\n        XlAnnouncement,'
    );
    
    fs.writeFileSync('models/xlModels.js', c);
    console.log('Added XlAnnouncement to xlModels.js');
} else {
    console.log('XlAnnouncement already exists.');
}
