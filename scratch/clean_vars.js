const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  "import { ArrowLeft, Trash2, Edit, Save, RefreshCw, Key, Mail , Eye, ArrowRightLeft, Check, Search } from 'lucide-react';",
  "import { ArrowLeft, Trash2, Edit, Save, RefreshCw, Key, Mail , Eye, Search } from 'lucide-react';"
);

c = c.replace(/const \[saving, setSaving\] = useState\(false\);\n/g, '');
c = c.replace(/const handleDelete = async \(id: string, isAdmin: boolean\) => \{[\s\S]*?\};\n/g, '');
c = c.replace(/const handleSave = async \(\) => \{[\s\S]*?\};\n/g, '');

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Unused vars properly removed!');
