const fs = require('fs');

// Fix routes/xl.js
let c = fs.readFileSync('routes/xl.js', 'utf8');

// Fix Expense 'undefined' issue
c = c.replace(/\`\$\{e\.type\} - \$\{e\.status\}\`/g, "\`${e.category || 'Expense'} - ${e.status}\`");

fs.writeFileSync('routes/xl.js', c);
console.log('Fixed Expense formatting in routes/xl.js');
