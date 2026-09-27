const fs = require('fs');

const primaryPath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesHistory.tsx';
const secondaryPath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesHistory.tsx';
const menuPath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/CreationMenu.tsx';
const appPath = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/App.tsx';

// 1. Create SecondarySalesHistory.tsx
let primaryCode = fs.readFileSync(primaryPath, 'utf8');

let secondaryCode = primaryCode
  .replace(/PrimarySalesHistory/g, 'SecondarySalesHistory')
  .replace(/primary-sales/g, 'secondary-sales')
  .replace(/PRIMARY <span/g, 'SECONDARY <span')
  .replace(/inv\.date/g, 'inv.createdAt') // Secondary sales often uses createdAt instead of date for history listing, or we can use inv.invoiceDate
  .replace(/inv.date \?/g, 'inv.createdAt ?') 
  .replace(/new Date\(inv.date\)/g, 'new Date(inv.createdAt)');

fs.writeFileSync(secondaryPath, secondaryCode);
console.log("Created SecondarySalesHistory.tsx");

// 2. Update CreationMenu.tsx link
let menuCode = fs.readFileSync(menuPath, 'utf8');
menuCode = menuCode.replace(
  "{ path: '/creation/secondary-sales', icon: ShoppingCart, label: 'Secondary Sales', description: 'Log secondary sales data', color: 'text-pink-400', bg: 'bg-pink-500/10' }",
  "{ path: '/creation/secondary-sales/history', icon: ShoppingCart, label: 'Secondary Sales', description: 'Log secondary sales data', color: 'text-pink-400', bg: 'bg-pink-500/10' }"
);
fs.writeFileSync(menuPath, menuCode);
console.log("Updated CreationMenu.tsx");

// 3. Update App.tsx routes
let appCode = fs.readFileSync(appPath, 'utf8');
if (!appCode.includes('SecondarySalesHistory')) {
  // Insert import
  appCode = appCode.replace(
    "import SecondarySalesForm from './pages/creation/SecondarySalesForm';",
    "import SecondarySalesForm from './pages/creation/SecondarySalesForm';\nimport SecondarySalesHistory from './pages/creation/SecondarySalesHistory';"
  );
  // Insert route
  appCode = appCode.replace(
    "<Route path=\"creation/secondary-sales\" element={<SecondarySalesForm />} />",
    "<Route path=\"creation/secondary-sales\" element={<SecondarySalesForm />} />\n          <Route path=\"creation/secondary-sales/history\" element={<SecondarySalesHistory />} />"
  );
  fs.writeFileSync(appPath, appCode);
  console.log("Updated App.tsx routes");
}
