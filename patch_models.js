const fs = require('fs');
let content = fs.readFileSync('models/xlModels.js', 'utf8');

// Add approvedBy to XlTourProgram
if (!content.includes('approvedBy: { type: DataTypes.STRING }')) {
  content = content.replace(
    |adminRemarks: { type: DataTypes.TEXT },\nsubmittedAt: { type: DataTypes.DATE },\napprovedAt: { type: DataTypes.DATE },|,
    |adminRemarks: { type: DataTypes.TEXT },\nsubmittedAt: { type: DataTypes.DATE },\napprovedAt: { type: DataTypes.DATE },\napprovedBy: { type: DataTypes.STRING },|
  );
}

fd.writeFileSync('models/xlModels.js', content);
