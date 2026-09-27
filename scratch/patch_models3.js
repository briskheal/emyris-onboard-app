const fs = require('fs');

let c = fs.readFileSync('models/xlModels.js', 'utf8');

c = c.replace(
  "location: { type: DataTypes.STRING },",
  "hq: { type: DataTypes.STRING },\n          area: { type: DataTypes.STRING },"
);

fs.writeFileSync('models/xlModels.js', c);
console.log('Updated xlModels.js');
