const fs = require('fs');
const file = 'xla-frontend/src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
    "{ path: '/extras/tour-program', icon: MapPin, label: 'Tour Program' },",
    "// { path: '/extras/tour-program', icon: MapPin, label: 'Tour Program' },"
);
fs.writeFileSync(file, code);
console.log('Sidebar link commented out');
