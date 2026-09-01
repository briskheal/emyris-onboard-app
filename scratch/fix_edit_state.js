const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

c = c.replace(
  "const [activeTab, setActiveTab] = useState<'create_doctor' | 'create_chemist' | 'create_stockist' | 'edit_delete' | 'upload_dcs' | 'dcs_list_management'>('create_doctor');",
  "const [activeTab, setActiveTab] = useState<'create_doctor' | 'create_chemist' | 'create_stockist' | 'edit_delete' | 'upload_dcs' | 'dcs_list_management'>('create_doctor');\n  const [editingRecord, setEditingRecord] = useState<any>(null);\n  const [editingType, setEditingType] = useState<string>('');"
);

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Fixed ManageDCS state');
