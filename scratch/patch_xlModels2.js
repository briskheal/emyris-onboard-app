const fs = require('fs');

let c = fs.readFileSync('models/xlModels.js', 'utf8');

if (!c.includes('location: { type: DataTypes.STRING }')) {
    c = c.replace(
      "isActive: { type: DataTypes.BOOLEAN, defaultValue: true },",
      "isActive: { type: DataTypes.BOOLEAN, defaultValue: true },\n          location: { type: DataTypes.STRING },"
    );
    fs.writeFileSync('models/xlModels.js', c);
    console.log('Updated xlModels.js with location field');
} else {
    console.log('location field already exists');
}
