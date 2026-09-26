const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  "import { ArrowLeft, Trash2, Edit, Save, RefreshCw, Key, Mail , Eye, ArrowRightLeft} from 'lucide-react';",
  "import { ArrowLeft, Trash2, Edit, Save, RefreshCw, Key, Mail , Eye, ArrowRightLeft, Check, Search } from 'lucide-react';"
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Added Check and Search icons');
