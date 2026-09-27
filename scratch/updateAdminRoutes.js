const fs = require('fs');

try {
    let code = fs.readFileSync('routes/admin.js', 'utf8');

    // 1. /save-template: Add confirm_delayed
    // Look for: else if (type === 'confirm') update.confirmLetterBody = body;
    code = code.replace(/else if \(type === 'confirm'\) update\.confirmLetterBody = body;/g, "else if (type === 'confirm') update.confirmLetterBody = body;\n        else if (type === 'confirm_delayed') update.confirmDelayedLetterBody = body;");

    // 2. /send-letter: Render confirmDelayedLetterBody if type is confirm_delayed
    // Look for: case 'confirm': template = company.confirmLetterBody; break;
    code = code.replace(/case 'confirm': template = company\.confirmLetterBody; break;/g, "case 'confirm': template = company.confirmLetterBody; break;\n                case 'confirm_delayed': template = company.confirmDelayedLetterBody; break;");

    // 3. /save-letter-snapshot: update status if letterType is confirm or confirm_delayed
    // Look for: const update = { canLogin: true };
    // Replace with status logic
    const saveSnapshotStart = "const update = { canLogin: true }; // Automatically ensure access when a letter is pushed to hub";
    const saveSnapshotReplacement = `const update = { canLogin: true }; // Automatically ensure access when a letter is pushed to hub
        if (letterType === 'confirm') update.status = 'Confirmed Employee';
        else if (letterType === 'confirm_delayed') update.status = 'Confirmation Extended';`;
    code = code.replace(new RegExp(saveSnapshotStart.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), saveSnapshotReplacement);

    fs.writeFileSync('routes/admin.js', code);
    console.log('Successfully updated routes/admin.js');
} catch (error) {
    console.error('Error modifying routes/admin.js:', error);
}
