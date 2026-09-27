const fs = require('fs');

// Patch App.tsx
let appCode = fs.readFileSync('xla-frontend/src/App.tsx', 'utf8');
const imports = `import Approvals from './pages/Approvals';\nimport ListsLayout from './pages/ListsLayout';\nimport DoctorsListReport from './pages/DoctorsListReport';`;
appCode = appCode.replace(`import Approvals from './pages/Approvals';`, imports);

const routes = `<Route path="utilities" element={<Utilities />} />
          <Route path="utilities/lists" element={<ListsLayout />}>
            <Route index element={<Navigate to="doctors" replace />} />
            <Route path="doctors" element={<DoctorsListReport />} />
          </Route>`;
appCode = appCode.replace(`<Route path="utilities" element={<Utilities />} />`, routes);
fs.writeFileSync('xla-frontend/src/App.tsx', appCode);

// Patch Utilities.tsx
let utilsCode = fs.readFileSync('xla-frontend/src/pages/Utilities.tsx', 'utf8');
utilsCode = utilsCode.replace(
  `import { useOutletContext } from 'react-router-dom';`,
  `import { useOutletContext, useNavigate } from 'react-router-dom';`
);

utilsCode = utilsCode.replace(
  `const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();`,
  `const { openDrawer } = useOutletContext<{ openDrawer: () => void }>();\n  const navigate = useNavigate();`
);

utilsCode = utilsCode.replace(
  `{ label: 'LISTS', description:`,
  `{ id: 'lists', label: 'LISTS', description:`
);

utilsCode = utilsCode.replace(
  `<div key={idx} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 rounded-2xl p-5 md:p-6 transition-all group shadow-lg flex gap-4 md:gap-5 items-start relative overflow-hidden">`,
  `<div key={idx} onClick={() => report.id === 'lists' && navigate('/utilities/lists/doctors')} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 rounded-2xl p-5 md:p-6 transition-all group shadow-lg flex gap-4 md:gap-5 items-start relative overflow-hidden cursor-pointer">`
);

fs.writeFileSync('xla-frontend/src/pages/Utilities.tsx', utilsCode);
console.log('Patched App.tsx and Utilities.tsx');
