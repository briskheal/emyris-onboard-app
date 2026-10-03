const fs = require('fs');
const file = 'xla-frontend/src/pages/Extras.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
    "{ label: 'Tour Program', path: '/extras/tour-program', description: 'Plan your monthly visits & get approval', icon: MapPin, color: 'text-rose-400', bg: 'bg-rose-400/10' },",
    "// { label: 'Tour Program', path: '/extras/tour-program', description: 'Plan your monthly visits & get approval', icon: MapPin, color: 'text-rose-400', bg: 'bg-rose-400/10' },"
);
fs.writeFileSync(file, code);
console.log('Extras link commented out');
