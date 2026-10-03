const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

if (!c.includes('Download,')) {
  c = c.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Download, Search } from 'lucide-react';");
}

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed imports');
