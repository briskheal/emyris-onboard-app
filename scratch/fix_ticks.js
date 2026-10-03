const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/components/CustomUserSelect.tsx', 'utf8');
c = c.replace(/\\`/g, '`');
fs.writeFileSync('xla-frontend/src/components/CustomUserSelect.tsx', c);
