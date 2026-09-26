const fs = require('fs');
const filePath = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Approvals.tsx';
let f = fs.readFileSync(filePath, 'utf8');

// Update useState
f = f.replace(
  "const [selectedModule, setSelectedModule] = useState('Tour Program');",
  "const [selectedModule, setSelectedModule] = useState(sessionStorage.getItem('adminApprovalModule') || 'Tour Program');"
);

// Update onClick
f = f.replace(
  "onClick={() => { setSelectedModule(item.path); setSelectedRows([]); }}",
  "onClick={() => { sessionStorage.setItem('adminApprovalModule', item.path); setSelectedModule(item.path); setSelectedRows([]); }}"
);

// Update ArrowDown
f = f.replace(
  "setSelectedModule(sidebarItems[currentIndex + 1].path);",
  "const p = sidebarItems[currentIndex + 1].path; sessionStorage.setItem('adminApprovalModule', p); setSelectedModule(p);"
);

// Update ArrowUp
f = f.replace(
  "setSelectedModule(sidebarItems[currentIndex - 1].path);",
  "const p = sidebarItems[currentIndex - 1].path; sessionStorage.setItem('adminApprovalModule', p); setSelectedModule(p);"
);

fs.writeFileSync(filePath, f);
console.log('Patched Approvals.tsx to remember selected tab');
