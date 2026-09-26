const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Settings.tsx', 'utf8');

c = c.replace(
  '<div className="flex-1 bg-[#1e1e2d] relative flex flex-col h-full overflow-hidden">',
  '<div className="flex-1 bg-[#1e1e2d] relative flex flex-col h-full overflow-y-auto">'
);

fs.writeFileSync('xla-frontend/src/pages/Settings.tsx', c);
console.log('Fixed Settings scroll');
