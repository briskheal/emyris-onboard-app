const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('xla-frontend/src');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes('axios.post(\'/api/xl/approvals/action\'')) {
    // Add approvedBy to the payload
    c = c.replace(/axios\.post\('[\"]\/api\/xl\/approvals\/action['\"],\s*\{/g, "axios.post('/api/xl/approvals/action', {\n            approvedBy: (JSON.parse(localStorage.getItem('user') || '{}').employeeId || JSON.parse(localStorage.getItem('user') || '{}').uid || 'Admin'),");
    fs.writeFileSync(f, c);
    console.log('Patched ' + f);
  }
});