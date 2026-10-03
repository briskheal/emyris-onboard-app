const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

c = c.replace(
  'setProducts(res.data.products);',
  'const filtered = res.data.products.filter(p => !(p.productName || "").toLowerCase().includes("sample"));\n        setProducts(filtered);'
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Applied samples filter to fetchProducts!');
