const fs = require('fs'); 
const lines = fs.readFileSync('models/xlModels.js', 'utf8').split('\n'); 
['xl_doctor', 'xl_chemist', 'xl_stockist', 'xl_route'].forEach(m => { 
  const idx = lines.findIndex(l => l.includes(`define('${m}'`)); 
  if(idx > -1) { 
    const chunk = lines.slice(idx, idx+20).join('\n'); 
    console.log(m, 'HQ field:', chunk.match(/headquarter|hq/i)?.[0]); 
  } 
});
