const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');
if (!c.includes(', Download }')) {
  c = c.replace(
    "import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft, Search, ArrowUp }",
    "import { Trash2, Edit2, Upload, Users, UserMinus, ArrowRightLeft, ArrowLeft, Search, ArrowUp, Download }"
  );
}
fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
