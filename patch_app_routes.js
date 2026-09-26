const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/App.tsx', 'utf8');

if (!f.includes('PrimarySalesForm')) {
    f = f.replace(
        "import StockistForm from './pages/creation/StockistForm';", 
        "import StockistForm from './pages/creation/StockistForm';\nimport PrimarySalesForm from './pages/creation/PrimarySalesForm';"
    );
    f = f.replace(
        '<Route path="creation/stockist" element={<StockistForm />} />', 
        '<Route path="creation/stockist" element={<StockistForm />} />\n          <Route path="creation/primary-sales" element={<PrimarySalesForm />} />'
    );
    fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/App.tsx', f);
    console.log('Patched App.tsx');
} else {
    console.log('App.tsx already patched');
}
