const fs = require('fs');
let code = fs.readFileSync('xla-frontend/src/App.tsx', 'utf8');

code = code.replace("import ProductsListReport from './pages/ProductsListReport';", "import ProductsListReport from './pages/ProductsListReport';\nimport GeoFencingListReport from './pages/GeoFencingListReport';");

code = code.replace("<Route path=\"products\" element={<ProductsListReport />} />", "<Route path=\"products\" element={<ProductsListReport />} />\n            <Route path=\"geo-fencing\" element={<GeoFencingListReport />} />");

fs.writeFileSync('xla-frontend/src/App.tsx', code);
