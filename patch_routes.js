const fs = require('fs');

const appPath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

if (!app.includes('PrimarySalesHistory')) {
    app = app.replace(
        "import PrimarySalesForm from './pages/creation/PrimarySalesForm';",
        "import PrimarySalesForm from './pages/creation/PrimarySalesForm';\nimport PrimarySalesHistory from './pages/creation/PrimarySalesHistory';"
    );
    app = app.replace(
        '<Route path="creation/primary-sales" element={<PrimarySalesForm />} />',
        '<Route path="creation/primary-sales" element={<PrimarySalesForm />} />\n          <Route path="creation/primary-sales/history" element={<PrimarySalesHistory />} />'
    );
    fs.writeFileSync(appPath, app);
}

const menuPath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/CreationMenu.tsx';
let menu = fs.readFileSync(menuPath, 'utf8');
if (!menu.includes('primary-sales/history')) {
    menu = menu.replace(
        "path: '/creation/primary-sales', icon: PackageSearch, label: 'Primary Sales', description: 'Log primary sales data', color: 'text-cyan-400', bg: 'bg-cyan-500/10'",
        "path: '/creation/primary-sales/history', icon: PackageSearch, label: 'Primary Sales', description: 'Log primary sales data', color: 'text-cyan-400', bg: 'bg-cyan-500/10'"
    );
    fs.writeFileSync(menuPath, menu);
}
console.log('App.tsx and CreationMenu.tsx updated!');
