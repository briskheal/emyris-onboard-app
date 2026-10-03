const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const hookStr = `
  useEffect(() => {
    if (activeSubTab === 'monthly') {
      fetchTargets();
    }
  }, [activeSubTab, selectedMonth, selectedYear]);
`;

c = c.replace('  const handleDeleteTarget =', hookStr + '\n  const handleDeleteTarget =');

c = c.replace(
  /<button onClick=\{fetchTargets\} className="mb-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold">\s*Load Data\s*<\/button>/g,
  ''
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Auto-fetch logic added!');
