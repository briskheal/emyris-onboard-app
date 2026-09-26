const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/App.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/import PrimarySalesHistory from '\.\/pages\/creation\/PrimarySalesHistory';/, "import PrimarySalesHistory from './pages/creation/PrimarySalesHistory';\nimport SecondarySalesForm from './pages/creation/SecondarySalesForm';");
c = c.replace(/<Route path="creation\/primary-sales\/history" element=\{<PrimarySalesHistory \/>\} \/>/, '<Route path="creation/primary-sales/history" element={<PrimarySalesHistory />} />\n          <Route path="creation/secondary-sales" element={<SecondarySalesForm />} />');

fs.writeFileSync(path, c);
console.log('App.tsx patched for Secondary Sales route');
