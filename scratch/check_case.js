const fs = require('fs');
const lines = fs.readFileSync('models/xlModels.js', 'utf8').split('\n');
['xl_user', 'xl_doctor', 'xl_chemist', 'xl_stockist', 'xl_route'].forEach(m => {
  const idx = lines.findIndex(l => l.includes(`define('${m}'`));
  if(idx > -1) {
    const chunk = lines.slice(idx, idx+20).join('\n');
    const m1 = chunk.match(/headquarter:.*$/m);
    const m2 = chunk.match(/hq:.*$/m);
    console.log(m, '=>', m1?.[0] || m2?.[0] || 'NONE');
  }
});
