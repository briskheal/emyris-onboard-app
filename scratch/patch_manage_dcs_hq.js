const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

c = c.replace(
  "!c.location || c.location.toLowerCase() === hq.toLowerCase()",
  "!c.hq || c.hq.toLowerCase() === hq.toLowerCase()"
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Updated ManageDCS location -> hq');
