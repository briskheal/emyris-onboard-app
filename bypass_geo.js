const fs = require('fs');
let code = fs.readFileSync('routes/xl.js', 'utf8');

const searchRegex = /\\/\\/ ?? Geo-fence check for Doctor, Chemist, and Stockist visits ??\\r?\\n\\s*if \\(entityType === 'Doctor' \\|\\| entityType === 'Chemist' \\|\\| entityType === 'Stockist'\\) \\{/;

const replacement = \// ?? Geo-fence check for Doctor, Chemist, and Stockist visits ??
        const todayStr2 = new Date().toISOString().split('T')[0];
        if (date === todayStr2 && (entityType === 'Doctor' || entityType === 'Chemist' || entityType === 'Stockist')) {\;

if (searchRegex.test(code)) {
    code = code.replace(searchRegex, replacement);
    fs.writeFileSync('routes/xl.js', code);
    console.log('Geo-fence bypassed for backlogs');
} else {
    console.log('Not found');
}

