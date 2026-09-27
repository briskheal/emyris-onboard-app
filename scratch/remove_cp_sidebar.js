const fs = require('fs');

// 1. Remove from Layout.tsx
const layoutFile = 'xla-frontend/src/components/Layout.tsx';
let layoutCode = fs.readFileSync(layoutFile, 'utf8');
layoutCode = layoutCode.replace(
    "{ path: '/extras/call-plan', icon: CalendarDays, label: 'Call Planning' },",
    "// { path: '/extras/call-plan', icon: CalendarDays, label: 'Call Planning' },"
);
fs.writeFileSync(layoutFile, layoutCode);

// 2. Remove from Extras.tsx
const extrasFile = 'xla-frontend/src/pages/Extras.tsx';
let extrasCode = fs.readFileSync(extrasFile, 'utf8');
extrasCode = extrasCode.replace(
    "{ label: 'Call Planning', path: '/extras/call-plan', description: 'Pre-call planning & objectives', icon: CalendarDays, color: 'text-sky-400', bg: 'bg-sky-400/10' },",
    "// { label: 'Call Planning', path: '/extras/call-plan', description: 'Pre-call planning & objectives', icon: CalendarDays, color: 'text-sky-400', bg: 'bg-sky-400/10' },"
);
fs.writeFileSync(extrasFile, extrasCode);

console.log('Successfully removed Call Planning from sidebar and extras menu.');
